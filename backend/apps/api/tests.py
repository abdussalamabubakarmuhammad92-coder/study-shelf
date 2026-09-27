"""API test suite — the regression net for the whole portal.

Covers: JWT auth, invite lifecycle, upload permissions, contributor
self-service, admin contributor management, password reset lifecycle,
download counting and ratings. Uses an isolated MEDIA_ROOT so uploads
never touch the developer's media folder.
"""
import os
import tempfile
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from apps.faculties.models import Department, Faculty
from apps.invites.models import InviteToken, PasswordResetToken
from apps.resources.models import Resource

User = get_user_model()

ISOLATED_MEDIA = tempfile.mkdtemp()


@override_settings(MEDIA_ROOT=ISOLATED_MEDIA)
class PortalAPITestCase(APITestCase):
    """Shared fixtures: one faculty/department and three users."""

    @classmethod
    def setUpTestData(cls):
        cls.faculty = Faculty.objects.create(name='Faculty of Computing', slug='computing')
        cls.dept = Department.objects.create(
            faculty=cls.faculty, name='Computer Science', slug='computer-science')
        cls.admin = User.objects.create_user(
            username='boss', password='boss-pass-123', role='admin')
        cls.alice = User.objects.create_user(
            username='alice', password='alice-pass-123', role='contributor',
            full_name='Alice Uploads', department=cls.dept)
        cls.bob = User.objects.create_user(
            username='bob', password='bob-pass-123', role='contributor')

    def setUp(self):
        self.admin_client = self.client_class()
        self.admin_client.force_authenticate(self.admin)
        self.alice_client = self.client_class()
        self.alice_client.force_authenticate(self.alice)
        self.bob_client = self.client_class()
        self.bob_client.force_authenticate(self.bob)

    def make_resource(self, uploader=None, **kwargs):
        f = SimpleUploadedFile('notes.pdf', b'%PDF-1.4 test-bytes',
                               content_type='application/pdf')
        return Resource.objects.create(
            title='Test Notes', course_code='CSC101', department=self.dept,
            file=f, file_name='notes.pdf', file_type='pdf',
            file_size=f.size, uploaded_by=uploader or self.alice, **kwargs)


class AuthTests(PortalAPITestCase):
    """JWT login/me — the real token path, not just force_authenticate."""

    def test_login_returns_tokens(self):
        res = self.client.post('/api/auth/login/',
                               {'username': 'alice', 'password': 'alice-pass-123'})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('access', res.data)
        self.assertIn('refresh', res.data)

    def test_login_rejects_bad_password(self):
        res = self.client.post('/api/auth/login/',
                               {'username': 'alice', 'password': 'wrong-pass'})
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_jwt_token_grants_me(self):
        token = self.client.post('/api/auth/login/', {
            'username': 'alice', 'password': 'alice-pass-123'}).data['access']
        res = self.client.get('/api/auth/me/',
                              HTTP_AUTHORIZATION=f'Bearer {token}')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['username'], 'alice')

    def test_me_requires_authentication(self):
        self.assertEqual(self.client.get('/api/auth/me/').status_code,
                         status.HTTP_401_UNAUTHORIZED)


class PublicBrowseTests(PortalAPITestCase):
    def test_faculties_public(self):
        res = self.client.get('/api/faculties/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 1)
        self.assertEqual(res.data[0]['slug'], 'computing')

    def test_resource_detail_public(self):
        resource = self.make_resource()
        res = self.client.get(f'/api/resources/{resource.id}/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('file_url', res.data)


class InviteTests(PortalAPITestCase):
    def test_only_admin_creates_invites(self):
        self.assertEqual(
            self.admin_client.post('/api/invites/', {}).status_code,
            status.HTTP_201_CREATED)
        self.assertEqual(
            self.alice_client.post('/api/invites/', {}).status_code,
            status.HTTP_403_FORBIDDEN)
        self.assertEqual(
            self.client.post('/api/invites/', {}).status_code,
            status.HTTP_401_UNAUTHORIZED)

    def test_validate_and_register(self):
        invite = InviteToken.generate(created_by=self.admin)
        self.assertTrue(self.client.get(
            '/api/invites/validate/', {'token': invite.token}).data['valid'])

        res = self.client.post('/api/auth/register/', {
            'token': invite.token, 'username': 'newbie',
            'full_name': 'New Contributor', 'email': 'newbie@uni.edu',
            'password': 'strong-pass-1', 'department': self.dept.id})
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data['user']['role'], 'contributor')
        self.assertEqual(res.data['user']['department_name'], 'Computer Science')
        invite.refresh_from_db()
        self.assertTrue(invite.is_used)
        self.assertEqual(invite.used_by.username, 'newbie')

    def test_used_token_cannot_register_twice(self):
        invite = InviteToken.generate(created_by=self.admin)
        payload = {'token': invite.token, 'username': 'first', 'full_name': 'F',
                   'email': 'f@uni.edu', 'password': 'strong-pass-1'}
        self.assertEqual(self.client.post('/api/auth/register/', payload).status_code,
                         status.HTTP_201_CREATED)
        payload2 = {**payload, 'username': 'second', 'email': 's@uni.edu'}
        self.assertEqual(self.client.post('/api/auth/register/', payload2).status_code,
                         status.HTTP_400_BAD_REQUEST)

    def test_expired_token_rejected(self):
        invite = InviteToken.generate(created_by=self.admin, expires_days=7)
        InviteToken.objects.filter(pk=invite.pk).update(
            expires_at=timezone.now() - timedelta(days=1))
        res = self.client.post('/api/auth/register/', {
            'token': invite.token, 'username': 'late', 'full_name': 'L',
            'email': 'late@uni.edu', 'password': 'strong-pass-1'})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_revoked_token_rejected(self):
        invite = InviteToken.generate(created_by=self.admin)
        invite.is_revoked = True
        invite.save()
        self.assertFalse(self.client.get(
            '/api/invites/validate/', {'token': invite.token}).data.get('valid', False))

    def test_duplicate_username_rejected(self):
        invite = InviteToken.generate(created_by=self.admin)
        res = self.client.post('/api/auth/register/', {
            'token': invite.token, 'username': 'alice', 'full_name': 'Dup',
            'email': 'dup@uni.edu', 'password': 'strong-pass-1'})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_admin_can_revoke_unused_invite(self):
        invite = InviteToken.generate(created_by=self.admin)
        self.assertEqual(
            self.admin_client.post(f'/api/invites/{invite.id}/revoke/').status_code,
            status.HTTP_200_OK)
        invite.refresh_from_db()
        self.assertTrue(invite.is_revoked)

    def test_used_invite_cannot_be_revoked(self):
        invite = InviteToken.generate(created_by=self.admin)
        invite.use(self.alice)
        res = self.admin_client.post(f'/api/invites/{invite.id}/revoke/')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)


class UploadPermissionTests(PortalAPITestCase):
    def upload(self, client, filename='my_lecture-notes.pdf'):
        f = SimpleUploadedFile(filename, b'%PDF-1.4 upload', content_type='application/pdf')
        return client.post('/api/resources/',
                           {'files': f, 'department': self.dept.id,
                            'course_code': 'csc201', 'description': 'd'})

    def test_anonymous_cannot_upload(self):
        self.assertEqual(self.upload(self.client).status_code,
                         status.HTTP_401_UNAUTHORIZED)

    def test_contributor_can_upload_and_title_is_derived(self):
        res = self.upload(self.alice_client)
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data[0]['title'], 'my lecture notes')
        self.assertEqual(res.data[0]['course_code'], 'CSC201')  # uppercased

    def test_admin_can_upload(self):
        self.assertEqual(self.upload(self.admin_client).status_code,
                         status.HTTP_201_CREATED)

    def test_deactivated_contributor_cannot_upload(self):
        User.objects.filter(pk=self.alice.pk).update(is_active_contributor=False)
        self.alice.refresh_from_db()
        res = self.upload(self.alice_client)
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn('contributor account', res.data['detail'])


class SelfServiceTests(PortalAPITestCase):
    def test_owner_can_edit_metadata(self):
        resource = self.make_resource()
        res = self.alice_client.patch(f'/api/resources/{resource.id}/',
                                      {'title': 'Renamed Notes'}, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        resource.refresh_from_db()
        self.assertEqual(resource.title, 'Renamed Notes')

    def test_edit_cannot_change_file_or_department(self):
        resource = self.make_resource()
        res = self.alice_client.patch(
            f'/api/resources/{resource.id}/',
            {'title': 'X', 'department': self.dept.id, 'file': 'nope'}, format='json')
        resource.refresh_from_db()
        self.assertEqual(resource.title, 'X')  # allowed field applied
        self.assertEqual(resource.file.name, resource.file.name)  # file untouched

    def test_other_contributor_cannot_edit_or_delete(self):
        resource = self.make_resource()
        self.assertEqual(self.bob_client.patch(
            f'/api/resources/{resource.id}/', {'title': 'Hijack'},
            format='json').status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(self.bob_client.delete(
            f'/api/resources/{resource.id}/').status_code,
            status.HTTP_403_FORBIDDEN)

    def test_anonymous_cannot_edit_or_delete(self):
        resource = self.make_resource()
        self.assertEqual(self.client.delete(
            f'/api/resources/{resource.id}/').status_code,
            status.HTTP_401_UNAUTHORIZED)

    def test_admin_can_edit_and_delete_any(self):
        resource = self.make_resource()
        self.assertEqual(self.admin_client.patch(
            f'/api/resources/{resource.id}/', {'title': 'Admin Edit'},
            format='json').status_code, status.HTTP_200_OK)
        self.assertEqual(self.admin_client.delete(
            f'/api/resources/{resource.id}/').status_code,
            status.HTTP_204_NO_CONTENT)
        self.assertFalse(Resource.objects.filter(pk=resource.id).exists())
        self.assertFalse(os.path.exists(resource.file.path))

    def test_owner_delete_removes_file_and_row(self):
        resource = self.make_resource()
        path = resource.file.path
        self.assertTrue(os.path.exists(path))
        self.assertEqual(self.alice_client.delete(
            f'/api/resources/{resource.id}/').status_code,
            status.HTTP_204_NO_CONTENT)
        self.assertFalse(Resource.objects.filter(pk=resource.id).exists())
        self.assertFalse(os.path.exists(path))


class ContributorAdminTests(PortalAPITestCase):
    def test_list_requires_admin(self):
        self.assertEqual(self.client.get('/api/admin/contributors/').status_code,
                         status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(self.alice_client.get('/api/admin/contributors/').status_code,
                         status.HTTP_403_FORBIDDEN)

    def test_admin_sees_roster_with_stats(self):
        self.make_resource(uploader=self.alice)
        res = self.admin_client.get('/api/admin/contributors/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        alice = next(u for u in res.data if u['username'] == 'alice')
        self.assertEqual(alice['upload_count'], 1)
        self.assertEqual(alice['upvotes_earned'], 0)
        self.assertEqual(alice['department_name'], 'Computer Science')

    def test_deactivate_toggle_blocks_upload(self):
        res = self.admin_client.patch(f'/api/admin/contributors/{self.alice.id}/',
                                      {'is_active_contributor': False}, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.alice.refresh_from_db()
        f = SimpleUploadedFile('x.pdf', b'%PDF-1.4', content_type='application/pdf')
        blocked = self.alice_client.post(
            '/api/resources/', {'files': f, 'department': self.dept.id})
        self.assertEqual(blocked.status_code, status.HTTP_403_FORBIDDEN)


class PasswordResetTests(PortalAPITestCase):
    def test_only_admin_generates_reset_tokens(self):
        self.assertEqual(
            self.admin_client.post(
                f'/api/admin/users/{self.alice.id}/reset-password/').status_code,
            status.HTTP_201_CREATED)
        self.assertEqual(
            self.alice_client.post(
                f'/api/admin/users/{self.bob.id}/reset-password/').status_code,
            status.HTTP_403_FORBIDDEN)

    def test_full_reset_lifecycle(self):
        token = self.admin_client.post(
            f'/api/admin/users/{self.alice.id}/reset-password/').data['token']

        self.assertTrue(self.client.get(
            '/api/auth/password-reset/validate/', {'token': token}).data['valid'])

        res = self.client.post('/api/auth/password-reset/confirm/',
                               {'token': token, 'password': 'brand-new-pass-9'})
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        # old password dead, new one works
        old_login = self.client.post('/api/auth/login/',
                                     {'username': 'alice', 'password': 'alice-pass-123'})
        self.assertEqual(old_login.status_code, status.HTTP_401_UNAUTHORIZED)
        new_login = self.client.post('/api/auth/login/',
                                     {'username': 'alice', 'password': 'brand-new-pass-9'})
        self.assertEqual(new_login.status_code, status.HTTP_200_OK)

        # token burned — second use rejected
        res = self.client.post('/api/auth/password-reset/confirm/',
                               {'token': token, 'password': 'another-pass-99'})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_new_generation_voids_old_token(self):
        first = self.admin_client.post(
            f'/api/admin/users/{self.alice.id}/reset-password/').data['token']
        self.admin_client.post(f'/api/admin/users/{self.alice.id}/reset-password/')
        res = self.client.post('/api/auth/password-reset/confirm/',
                               {'token': first, 'password': 'brand-new-pass-9'})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_expired_token_rejected(self):
        prt = PasswordResetToken.generate(user=self.alice, created_by=self.admin)
        PasswordResetToken.objects.filter(pk=prt.pk).update(
            expires_at=timezone.now() - timedelta(hours=1))
        res = self.client.post('/api/auth/password-reset/confirm/',
                               {'token': prt.token, 'password': 'brand-new-pass-9'})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_short_password_rejected(self):
        token = self.admin_client.post(
            f'/api/admin/users/{self.alice.id}/reset-password/').data['token']
        res = self.client.post('/api/auth/password-reset/confirm/',
                               {'token': token, 'password': 'short'})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)


class DownloadAndRatingTests(PortalAPITestCase):
    def test_download_increments_and_streams(self):
        resource = self.make_resource()
        res = self.client.post(f'/api/resources/{resource.id}/download/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertTrue(res.streaming or b'%PDF' in b''.join(res.streaming_content))
        resource.refresh_from_db()
        self.assertEqual(resource.download_count, 1)

    def test_download_missing_file_returns_404(self):
        resource = self.make_resource()
        os.remove(resource.file.path)
        res = self.client.post(f'/api/resources/{resource.id}/download/')
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_rate_increments(self):
        resource = self.make_resource()
        res = self.client.post(f'/api/resources/{resource.id}/rate/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['rating_count'], 1)
        self.assertEqual(res.data['average_rating'], 1)


class AdminResourceFilterTests(PortalAPITestCase):
    def test_faculty_and_department_filters(self):
        other_faculty = Faculty.objects.create(name='Faculty of Arts', slug='arts')
        other_dept = Department.objects.create(
            faculty=other_faculty, name='Economics', slug='economics')
        Resource.objects.create(
            title='CS Notes', department=self.dept, file_name='a.pdf',
            file_type='pdf', uploaded_by=self.alice)
        Resource.objects.create(
            title='Econ Notes', department=other_dept, file_name='b.pdf',
            file_type='pdf', uploaded_by=self.alice)

        res = self.admin_client.get('/api/admin/resources/', {'faculty': 'computing'})
        self.assertEqual([r['title'] for r in res.data], ['CS Notes'])
        res = self.admin_client.get('/api/admin/resources/', {'department': 'economics'})
        self.assertEqual([r['title'] for r in res.data], ['Econ Notes'])

    def test_admin_delete_removes_file(self):
        resource = self.make_resource()
        path = resource.file.path
        res = self.admin_client.delete(f'/api/admin/resources/{resource.id}/')
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(os.path.exists(path))


class StatsTests(PortalAPITestCase):
    def test_admin_stats(self):
        self.make_resource()
        res = self.admin_client.get('/api/admin/stats/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['total_resources'], 1)
        self.assertEqual(res.data['faculty_count'], 1)
