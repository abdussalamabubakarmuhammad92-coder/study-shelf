"""
Seed the portal with faculties, departments, users, an invite token and
sample resources (small generated PDFs) so the app is demo-ready.

Usage:
    python manage.py seed_data
"""
import datetime

from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.faculties.models import Department, Faculty
from apps.invites.models import InviteToken
from apps.resources.models import Resource
from apps.users.models import User

FACULTIES = {
    'Faculty of Agriculture': {
        'icon': 'Wheat',
        'description': 'Agricultural science, fisheries, forestry and food technology.',
        'departments': ['Agricultural Science', 'Fisheries and Aquaculture',
                        'Forestry and Wildlife Management', 'Food Science and Technology'],
    },
    'Faculty of Arts & Social Sciences': {
        'icon': 'Landmark',
        'description': 'Languages, humanities, social sciences and information studies.',
        'departments': ['Arabic', 'Criminology and Security Studies', 'Economics',
                        'English Language', 'Library and Information Science',
                        'Linguistics (Arabic)', 'Linguistics (English)', 'Political Science'],
    },
    'Faculty of Basic Medical Sciences': {
        'icon': 'HeartPulse',
        'description': 'Foundational biomedical and public health sciences.',
        'departments': ['Environmental Health Sciences', 'Human Anatomy',
                        'Human Physiology', 'Nursing Science', 'Public Health'],
    },
    'Faculty of Clinical Sciences': {
        'icon': 'Stethoscope',
        'description': 'Clinical training in medicine and surgery (MBBS).',
        'departments': ['MBBS'],
    },
    'Faculty of Computing': {
        'icon': 'Cpu',
        'description': 'Software, security and intelligent systems.',
        'departments': ['Computer Science', 'Cyber Security', 'Information Technology',
                        'Software Engineering'],
    },
    'Faculty of Education': {
        'icon': 'GraduationCap',
        'description': 'Teacher education and pedagogy.',
        'departments': ['Islamic Studies', 'Primary Education'],
    },
    'Faculty of Management Sciences': {
        'icon': 'Briefcase',
        'description': 'Accounting, finance, business, insurance and taxation.',
        'departments': ['Accounting', 'Actuarial Science', 'Banking and Finance',
                        'Business Administration', 'Insurance', 'Taxation'],
    },
    'Faculty of Life Sciences': {
        'icon': 'Leaf',
        'description': 'Biochemistry, biology and the living world.',
        'departments': ['Biochemistry', 'Biology', 'Biotechnology', 'Botany',
                        'Microbiology', 'Zoology'],
    },
    'Faculty of Physical Sciences': {
        'icon': 'Atom',
        'description': 'Chemistry, mathematics, physics and environmental sciences.',
        'departments': ['Chemistry', 'Environmental Management and Toxicology',
                        'Industrial Chemistry', 'Industrial Mathematics',
                        'Mathematics', 'Physics'],
    },
}

# (faculty key fragment, department, course code, title, description, featured)
SAMPLE_RESOURCES = [
    ('Computing', 'Computer Science', 'CSC101', 'Introduction to Computing - Lecture Notes 1-7',
     'Full semester lecture notes covering algorithms, hardware basics and number systems.', True),
    ('Computing', 'Computer Science', 'CSC201', 'Data Structures and Algorithms - Handout',
     'Linked lists, trees, graphs, sorting and complexity analysis with worked examples.', True),
    ('Computing', 'Computer Science', 'CSC301', 'Operating Systems - Past Questions 2019-2024',
     'Six years of past exam questions with solutions guide.', False),
    ('Computing', 'Software Engineering', 'SWE305', 'Software Requirements Engineering',
     'Elicitation techniques, SRS documentation and agile requirements.', False),
    ('Computing', 'Software Engineering', 'SWE401', 'Software Testing and Quality Assurance',
     'Unit testing, CI pipelines, code review practice and QA processes.', False),
    ('Computing', 'Cyber Security', 'CYB302', 'Network Security Fundamentals',
     'Firewalls, IDS/IPS, cryptography basics and security protocols.', True),
    ('Computing', 'Cyber Security', 'CYB405', 'Ethical Hacking and Penetration Testing Notes',
     'Reconnaissance, vulnerability scanning and responsible disclosure.', False),
    ('Computing', 'Information Technology', 'ITE150', 'Web Development Primer (HTML, CSS, JS)',
     'Beginner-friendly guide to building your first responsive website.', False),
    ('Computing', 'Information Technology', 'ITE220', 'Computer Networks and Administration',
     'TCP/IP, routing, switching and network troubleshooting labs.', True),

    ('Physical Sciences', 'Physics', 'PHY101', 'General Physics I - Lecture Notes',
     'Mechanics: kinematics, Newtonian dynamics, energy and momentum.', True),
    ('Physical Sciences', 'Physics', 'PHY102', 'General Physics II Lab Manual',
     'Electricity and magnetism experiments with report templates.', False),
    ('Physical Sciences', 'Physics', 'PHY301', 'Quantum Mechanics - Lecture Notes',
     'Wave functions, Schrödinger equation and angular momentum.', False),
    ('Physical Sciences', 'Chemistry', 'CHM121', 'Basic Analytical Chemistry Notes',
     'Stoichiometry, titrations, spectrophotometry and error analysis.', False),
    ('Physical Sciences', 'Industrial Chemistry', 'ICH204', 'Industrial Chemistry Processes',
     'Unit operations, catalysis, polymers and process design basics.', False),
    ('Physical Sciences', 'Mathematics', 'MTH201', 'Mathematical Methods I - Problem Sets',
     'Matrices, vectors, ODEs and Fourier series practice problems.', True),
    ('Physical Sciences', 'Industrial Mathematics', 'IMT210', 'Numerical Analysis Handout',
     'Interpolation, numerical integration and iterative methods.', False),
    ('Physical Sciences', 'Environmental Management and Toxicology', 'EMT301',
     'Environmental Toxicology - Lecture Notes',
     'Pollutant fate, dose-response, ecotoxicology and risk assessment.', True),

    ('Life Sciences', 'Biology', 'BIO101', 'General Biology - Complete Lecture Notes',
     'Cell structure, genetics, evolution and ecology overview.', True),
    ('Life Sciences', 'Biochemistry', 'BCH201', 'Bioenergetics and Metabolism',
     'Glycolysis, TCA cycle, oxidative phosphorylation summaries.', False),
    ('Life Sciences', 'Biochemistry', 'BCH305', 'Enzymology - Lecture Notes',
     'Enzyme kinetics, inhibition, regulation and cofactors.', False),
    ('Life Sciences', 'Microbiology', 'MCB201', 'General Microbiology Lab Guide',
     'Staining, culturing, sterilization and identification methods.', False),
    ('Life Sciences', 'Botany', 'BOT205', 'Plant Physiology Handout',
     'Photosynthesis, transpiration, hormones and mineral nutrition.', True),
    ('Life Sciences', 'Zoology', 'ZOO203', 'Comparative Anatomy of Vertebrates',
     'Skeletal, circulatory and nervous systems across vertebrate classes.', False),
    ('Life Sciences', 'Biotechnology', 'BTH310', 'Molecular Biology Techniques',
     'PCR, gel electrophoresis, cloning and CRISPR overview.', True),

    ('Management Sciences', 'Accounting', 'ACC101', 'Principles of Financial Accounting',
     'Double-entry bookkeeping, trial balance and final accounts.', True),
    ('Management Sciences', 'Accounting', 'ACC301', 'Cost Accounting Past Questions',
     'Marginal and absorption costing past exams, 2018-2024.', False),
    ('Management Sciences', 'Actuarial Science', 'ACT205', 'Actuarial Mathematics Notes',
     'Interest theory, annuities, life tables and premium calculation.', False),
    ('Management Sciences', 'Banking and Finance', 'BKF202', 'Money and Banking Handout',
     'Monetary policy, commercial banking and the financial system.', False),
    ('Management Sciences', 'Business Administration', 'BUS204', 'Organizational Behaviour Notes',
     'Motivation theories, leadership styles and group dynamics.', False),
    ('Management Sciences', 'Insurance', 'INS105', 'Principles of Insurance',
     'Risk, insurable interest, premiums and claims management.', True),
    ('Management Sciences', 'Taxation', 'TAX201', 'Introduction to Taxation',
     'Income tax, VAT, company tax and personal reliefs.', False),

    ('Arts & Social Sciences', 'Arabic', 'ARB101', 'Introduction to Arabic Grammar',
     'Nahw and sarf basics with guided reading exercises.', False),
    ('Arts & Social Sciences', 'Criminology and Security Studies', 'CSS201',
     'Foundations of Criminology',
     'Crime theories, criminal justice system and security studies.', False),
    ('Arts & Social Sciences', 'Economics', 'ECO101', 'Principles of Economics',
     'Micro/macro basics: demand, supply, national income and inflation.', True),
    ('Arts & Social Sciences', 'English Language', 'ENG111', 'Introduction to Language Study',
     'Phonetics, morphology, syntax and sociolinguistics overview.', True),
    ('Arts & Social Sciences', 'Library and Information Science', 'LIS101',
     'Introduction to Library and Information Science',
     'Library classification, cataloguing and information retrieval.', False),
    ('Arts & Social Sciences', 'Linguistics (Arabic)', 'LNA204', 'Arabic Linguistics Notes',
     'Phonology and morphology of Arabic with analytic exercises.', False),
    ('Arts & Social Sciences', 'Linguistics (English)', 'LNE204', 'English Linguistics Notes',
     'IPA transcription, articulatory phonetics and phonological rules.', False),
    ('Arts & Social Sciences', 'Political Science', 'POL101', 'Introduction to Political Science',
     'State, power, political systems and comparative government.', False),

    ('Education', 'Islamic Studies', 'EDU-ISL201', 'Islamic Studies Education Methods',
     'Islamic studies curriculum, pedagogy and assessment.', False),
    ('Education', 'Primary Education', 'PPE101', 'Foundations of Primary Education',
     'Child development, literacy, numeracy and classroom practice.', True),

    ('Basic Medical Sciences', 'Environmental Health Sciences', 'EHS205',
     'Environmental Health - Lecture Notes',
     'Water and sanitation, air quality and occupational health.', False),
    ('Basic Medical Sciences', 'Human Anatomy', 'ANA201', 'Gross Anatomy Lecture Notes - Upper Limb',
     'Bones, muscles, vessels and nerves of the upper limb.', True),
    ('Basic Medical Sciences', 'Human Anatomy', 'ANA202', 'Histology - Tissue Types Guide',
     'Epithelial, connective, muscle and nervous tissue micrographs.', False),
    ('Basic Medical Sciences', 'Human Physiology', 'PHY201', 'Cardiovascular Physiology Handout',
     'Cardiac cycle, ECG basics and blood pressure regulation.', False),
    ('Basic Medical Sciences', 'Nursing Science', 'NUR201', 'Fundamentals of Nursing Practice',
     'Vital signs, asepsis, documentation and patient safety.', True),
    ('Basic Medical Sciences', 'Public Health', 'PBH301', 'Introduction to Public Health',
     'Epidemiology basics, health promotion and disease prevention.', False),

    ('Clinical Sciences', 'MBBS', 'MBBS500', 'Clinical Methods Guide',
     'History taking, physical examination and common ward procedures.', True),
    ('Clinical Sciences', 'MBBS', 'MBBS420', 'Pharmacology & Therapeutics for MBBS',
     'Core drug classes, dosing principles and adverse effects.', False),
    ('Clinical Sciences', 'MBBS', 'MBBS410', 'Past Questions Compilation 2019-2024',
     'Six years of professional exams with revision notes.', False),

    ('Agriculture', 'Agricultural Science', 'AGS201', 'Principles of Crop Production',
     'Cropping systems, tillage, irrigation and pest management.', False),
    ('Agriculture', 'Agricultural Science', 'AGS105', 'Introduction to Soil Science',
     'Soil profile, texture, fertility and classification.', True),
    ('Agriculture', 'Fisheries and Aquaculture', 'FIS210', 'Aquaculture Systems Notes',
     'Pond management, water quality and fish nutrition.', False),
    ('Agriculture', 'Forestry and Wildlife Management', 'FWM204', 'Forestry and Silviculture Notes',
     'Tree propagation, forest ecology and wildlife conservation.', False),
    ('Agriculture', 'Food Science and Technology', 'FST210', 'Food Preservation and Processing',
     'Drying, canning, fermentation and food safety standards.', True),
]


def make_pdf(title: str, body_lines: list) -> bytes:
    """Generate a minimal valid one-page PDF with the given text."""
    def esc(s):
        return s.replace('\\', r'\\').replace('(', r'\(').replace(')', r'\)')

    content = 'BT /F1 18 Tf 60 760 Td (' + esc(title[:80]) + ') Tj ET\n'
    content += 'BT /F1 11 Tf 60 720 Td 14 TL\n'
    for line in body_lines:
        content += '(' + esc(line[:95]) + ') Tj T*\n'
    content += 'ET'

    objects = [
        '<< /Type /Catalog /Pages 2 0 R >>',
        '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
        '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] '
        '/Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
        f'<< /Length {len(content)} >>\nstream\n{content}\nendstream',
        '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    ]
    pdf = b'%PDF-1.4\n'
    offsets = []
    for i, obj in enumerate(objects, start=1):
        offsets.append(len(pdf))
        pdf += f'{i} 0 obj\n{obj}\nendobj\n'.encode('latin-1', 'replace')
    xref_pos = len(pdf)
    pdf += f'xref\n0 {len(objects) + 1}\n0000000000 65535 f \n'.encode()
    for off in offsets:
        pdf += f'{off:010d} 00000 n \n'.encode()
    pdf += (f'trailer\n<< /Size {len(objects) + 1} /Root 1 0 R >>\n'
            f'startxref\n{xref_pos}\n%%EOF').encode()
    return pdf


class Command(BaseCommand):
    help = 'Seed faculties, departments, users, an invite and sample resources.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--production', action='store_true',
            help='Seed taxonomy + admin only: no contributor, invite or sample resources.')

    def handle(self, *args, **options):
        production = options['production']
        self.stdout.write('Seeding faculties and departments…')
        for faculty_name, info in FACULTIES.items():
            faculty, _ = Faculty.objects.get_or_create(
                name=faculty_name,
                defaults={'slug': self._slug(faculty_name),
                          'description': info['description'],
                          'icon': info['icon']},
            )
            for dept_name in info['departments']:
                Department.objects.get_or_create(
                    faculty=faculty,
                    slug=self._slug(dept_name),
                    defaults={'name': dept_name},
                )

        self.stdout.write('Creating users…')
        if not User.objects.filter(username='admin').exists():
            User.objects.create_superuser(
                username='admin', email='admin@university.edu', password='admin123',
                full_name='Portal Administrator', role='admin',
            )
            self.stdout.write(self.style.SUCCESS(
                '  Admin: admin / admin123 (admin@university.edu)'))
        if not production and not User.objects.filter(username='contributor').exists():
            cs_dept = Department.objects.filter(name='Computer Science').first()
            User.objects.create_user(
                username='contributor', email='contributor@example.com',
                password='contributor123', full_name='Demo Contributor',
                role='contributor', department=cs_dept,
            )
            self.stdout.write(self.style.SUCCESS(
                '  Contributor: contributor / contributor123'))

        if production:
            self.stdout.write(self.style.SUCCESS(
                'Production mode: taxonomy + admin seeded; no demo content.'))
            return

        self.stdout.write('Creating a demo invite token…')
        if not InviteToken.objects.filter(note='Demo invite').exists():
            invite = InviteToken.generate(
                created_by=User.objects.get(username='admin'),
                note='Demo invite', expires_days=30,
            )
            self.stdout.write(self.style.SUCCESS(f'  Invite token: {invite.token}'))

        self._seed_resources()

        self.stdout.write(self.style.SUCCESS(
            f'Done. Faculties: {Faculty.objects.count()}, '
            f'Departments: {Department.objects.count()}, '
            f'Resources: {Resource.objects.count()}'))

    def _seed_resources(self):
        if Resource.objects.exists():
            self.stdout.write('Resources already exist; skipping.')
            return
        admin = User.objects.get(username='admin')
        uploader = User.objects.filter(username='contributor').first() or admin
        now = timezone.now()
        count = 0
        for faculty_key, dept_name, code, title, desc, featured in SAMPLE_RESOURCES:
            faculty = next(
                (f for f in Faculty.objects.all() if faculty_key in f.name), None)
            if not faculty:
                continue
            dept = Department.objects.filter(faculty=faculty, name=dept_name).first()
            if not dept:
                continue
            body = [
                f'Course: {code} - {title}',
                f'Department: {dept_name}',
                f'Faculty: {faculty.name}',
                '',
                desc,
                '',
                'This is a sample seeded resource for demonstration purposes.',
                'Replace it with real course materials via the Upload page.',
                '',
                'University Resource Portal - shared by contributors, for students.',
            ]
            pdf_bytes = make_pdf(f'{code} - {title}', body)
            resource = Resource(
                title=title, course_code=code, description=desc,
                department=dept, file_name=f'{code}_{"_".join(title.split()[:4])}.pdf',
                file_type='pdf', file_size=len(pdf_bytes),
                uploaded_by=uploader, is_featured=featured,
                download_count=(count * 7) % 53,  # varied demo stats
                rating_count=(count % 9) + 2,
                rating_sum=((count % 9) + 2) - (0 if count % 3 else 1),
            )
            resource.file.save(resource.file_name, ContentFile(pdf_bytes), save=False)
            resource.upload_date = now - datetime.timedelta(days=count % 40,
                                                            hours=count % 20)
            resource.save()
            count += 1
        self.stdout.write(self.style.SUCCESS(f'  Created {count} sample PDF resources.'))

    @staticmethod
    def _slug(name: str) -> str:
        import re
        slug = re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')
        return slug
