from app.services.supabase_client import get_supabase
from fastapi import HTTPException

class RevenueService:
    def __init__(self):
        pass

    async def ensure_active_subscription(self, church_id: str):
        """
        Checks if the church has an active subscription.
        Raises HTTPException(402) if not active.
        """
        supabase = get_supabase()
        
        # Determine subscription status
        # We query the church table directly. 
        # In a real impl, we might cache this or check Stripe API directly (latency hit).
        # Trusting DB is faster for middleware gating.
        
        response = supabase.table("churches").select("subscription_status").eq("id", church_id).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Church not found")
            
        status = response.data[0].get("subscription_status", "inactive")
        
        if status != "active":
            raise HTTPException(
                status_code=402, 
                detail="Payment Required: Active subscription needed for this feature."
            )
        
        return True
