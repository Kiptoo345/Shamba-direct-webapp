### *CONTRACT DEVIATIONS.*



* There was no contract deviation.
* Mismatches found during implementation were resolved by fixing the implementation of the code to match the existing contract rather than changing openapi.yaml.





The following were the issues corrected:

1. GET /market-prices was adjusted to return only the fields specified by the contract: crop\_name, price\_per\_kg, and county.

2. GET /farmers/ratings was implemented under the contract path /farmers/ratings, thus was necessary to add a new route in the implementing code

3. GET /headquarters was updated to support the optional county query parameter and return the fields specified by the contract by removing those that were not.

4. In the GET /listings endpoint, quantity\_kg filed was adjusted to be the same type as the contract promised: integer not string.



* No changes were made to openapi.yaml.

