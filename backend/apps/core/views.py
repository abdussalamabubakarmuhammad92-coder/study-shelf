from django.conf import settings
from django.http import FileResponse, Http404


def spa_index(request):
    """Serve the React SPA for any non-API route.

    Never answers for /static/, /media/ or unmatched /api/ paths: a missing
    asset or API endpoint must 404, not return HTML (HTML-as-JS is the silent
    blank-page failure mode).
    """
    if request.path.startswith(('/static/', '/media/', '/api/')):
        raise Http404('Asset not found.')
    index = settings.FRONTEND_INDEX
    if not index.exists():
        raise Http404(
            'Frontend build not found. Run `npm run build:unified` in frontend/.'
        )
    return FileResponse(index.open('rb'), content_type='text/html')
