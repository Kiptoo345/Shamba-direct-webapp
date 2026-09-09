API Needs.



Downstream Interview.



1.) What data or actions from Shamba Direct would be useful to you?



* Market price — to display estimated monthly food and living costs on accommodation pages
* Headquarters locations — to calculate distance from student housing to nearest fresh produce hub
* Active listings — to show students what fresh produce is available near their chosen accommodation
* Farmer ratings — to show verified food vendor quality scores near Students' residences.



2.) Would you ever need to create or change data in our system, or only read it?



Read and display only - They do not need to create farmer accounts, modify prices, or delete any records in our system



3.) How often would you need this — once per page load? Real-time? Once a day?



Once per page load for market prices and active listings



4.) Is there anything about our app you assumed you could access, that isn't there?



* Farmer phone numbers — they initially considered connecting students to vendors directly but phone numbers are restricted for privacy
* Real-time price feeds — they assumed prices almost immediately but our data pipeline runs on a schedule, which is sufficient for their use case



API Needs Statement.



1. SettleIn needs to read a list of current market commodity prices per kg, including crop name and price in KES, in order to display an estimated monthly food and living cost widget on student accommodation detail pages.
2. SettleIn needs to read verified farmer quality ratings in order to display a nearby food vendor trust score on the student neighbourhood information section of a property profile.
3. SettleIn needs to read active produce listings filtered by county in order to show students which fresh food types are currently available near their chosen accommodation area.
4. SettleIn needs to read headquarters, including region name and county, in order to calculate the distance from student accommodation to the nearest fresh produce hub.



Reflection. 

The interview with SettleIn revealed something we did not expect — they were more concerned with how stale our data could be than what data we expose.They were more focused on our caching and update pipeline and how frequently data is updated, forcing us to think about freshness guarantees we had not yet formally defined. We had not explicitly marked contact details as restricted in our Week 1 audit, but the interview made clear that phone numbers and National ID must be treated as private fields













