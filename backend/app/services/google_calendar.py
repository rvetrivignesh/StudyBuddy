"""Direct Google Calendar sync - NOT implemented yet (the .ics export already works with Google Calendar).

To implement:
 1. Create an OAuth client in Google Cloud Console (Calendar API enabled).
 2. Add /auth/google/start + /auth/google/callback routes; store the user's refresh token in Mongo.
 3. With google-api-python-client: service.events().insert(calendarId="primary", body=...) per plan event.
"""
from app.core.errors import NotImplementedFeature


async def sync_plan_to_google(user_id: str, plan: dict) -> None:
    raise NotImplementedFeature("Google Calendar sync is not implemented yet. Use the .ics export and import it into Google Calendar.")
