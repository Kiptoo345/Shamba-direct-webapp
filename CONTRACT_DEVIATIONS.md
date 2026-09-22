### *CONTRACT DEVIATIONS.*



##### \## Week 5 GET Endpoints.

* There was no contract deviation.
* Mismatches found during implementation were resolved by fixing the implementation of the code to match the existing contract rather than changing openapi.yaml.





The following were the issues corrected:

1. GET /market-prices was adjusted to return only the fields specified by the contract: crop\_name, price\_per\_kg, and county.

2. GET /farmers/ratings was implemented under the contract path /farmers/ratings, thus was necessary to add a new route in the implementing code

3. GET /headquarters was updated to support the optional county query parameter and return the fields specified by the contract by removing those that were not.

4. In the GET /listings endpoint, quantity\_kg filed was adjusted to be the same type as the contract promised: integer not string.

5. GET /listings/{id} price\_per\_kg was returned as a string, fixed to return as a number. 
6. Extra fields: harvest\_note, image\_emoji, status, created\_at, updated\_at) were removed from the response
7. farmer\_verified was returned as 1 (integer), fixed to return as a boolean



* No changes were made to openapi.yaml.





##### \## Week 6 Write Endpoints.

* No logic changes were made to the contract structure itself.



* There were a few changes made:

  1. Field listing\_id was renamed to product\_id in the openapi.yaml contract to match the actual database column name in the enquires table
  2. Added 400 Bad Request response for missing/invalid fields which were not in the contract
  3. Added 404 Not Found response for when the product\_id does not exist in the products table







