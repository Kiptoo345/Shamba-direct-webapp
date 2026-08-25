1.
## List things app stores
 - User name 
 - User role
 - Market price
 - Farmer Rating
 - Headquaters
 - Total Earnings
 - Farmer Rating

2. Read
update 
3.Govt ID
phone number.

4. Expected freshness is ∼5 minutes.Source updates every 1 minute
Our fetcher runs every 5 minutes via cronWe cache for 60 seconds in Redis
So in the worst case, user sees data that is 6 minutes old. We expose this with a fetched_at timestamp."
