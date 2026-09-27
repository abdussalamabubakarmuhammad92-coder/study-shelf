"""Tests for the SPA-serving view (apps.core)."""
from django.test import TestCase
from django.urls import reverse


class SpaIndexTests(TestCase):
    def test_unknown_paths_render_spa(self):
        for path in ('/', '/resource/5/', '/browse/x/y/', '/invite/sometoken/'):
            res = self.client.get(path)
            self.assertEqual(res.status_code, 200, path)
            self.assertIn(b'<div id="root">', b''.join(res.streaming_content))

    def test_missing_static_asset_404s_instead_of_returning_html(self):
        """A missing /static/ file must 404 — returning index.html here is
        the blank-page failure mode (HTML served as JavaScript)."""
        res = self.client.get('/static/assets/definitely-missing-bundle.js')
        self.assertEqual(res.status_code, 404)

    def test_missing_media_404s(self):
        res = self.client.get('/media/resources/2026/01/missing.pdf')
        self.assertEqual(res.status_code, 404)

    def test_api_paths_do_not_reach_spa(self):
        res = self.client.get('/api/definitely-not-a-real-endpoint/')
        self.assertEqual(res.status_code, 404)
