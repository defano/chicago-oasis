# Desert Chicago

A visualization of business desertifaction by neighborhood or census tract based on public data provided by the City of Chicago.

Desert Chicago is a trivial [Node.js](http://nodejs.org/) application; it uses the Express framework for routing requests to static resources but otherwise doesn't expose web services or consume external data sources (like a database). 

The application's user interface is based on Bootstrap/jQuery and makes use of the awesome-bootstrap-checkbox, bootstrap-multiselect, and seiyra-bootstrap-slider plugins. 

## Running the App

### Running Locally

Make sure you have Node.js and the Node Package Manager (npm) installed.

```sh
$ git clone git@github.com:defano/desert-chicago-njs.git # or clone your own fork
$ cd desert-chicago-njs
$ npm install
$ npm start
```

Your app should now be running on [localhost:5000](http://localhost:5000/).

### Deploying to IBM Bluemix

Make sure you have the Cloud Foundry command line tools installed.

```sh
$ cf login # provide Bluemix authentication credentials
$ cf push desert-chicago-njs
```

### Deploying to Heroku

This GitHub repository is configured for continuous delivery to Heroku; any changes pushed to the master branch will result in the app being  redeployed on the Heroku cloud.

That said, you can fork this code and deploy it to your own Heroku environment. Make sure you have the [Heroku Toolbelt](https://toolbelt.heroku.com/) installed:

```sh
$ heroku create
$ git push heroku master
$ heroku open
```

## Documentation

### Data Sources

The application utilizes three datasets:

- Neighborhood (77 officially recognized "community areas") and census tract boundaries
- Desertification indicies for each census tract and community per business type per year
- Critical businesses for each business type per year

#### Community and Census Tract Boundaries

As the application initializes, it queries two Google Fusion tables to fetch the neighborhood and census tract polygons that it will render on the map.

This data consists of one table for census tracts, and another for community areas. Each table has three columns: ID, NAME and GEOMETRY. For both tables, the GEOMETRY column contains a "MultiGeometry" KML fragment representing the area's polygon boundary and centroid (see the FAQs for a discussion of how this was created). For the census table, the ID column represents the 10-digit census tract number (a nationally-unique value). The NAME column contains the more human-readable, dotted-decimal tract name (unique only within the ciy). Within the community table, the NAME and ID columns both contain the officially recoginized community name (for example, "LINCOLN PARK" or "DOUGLAS").

See the FAQs for a discussion of how this data was created.

#### Desertification Indicies

Each time the user changes the selection of business, year, and geography type, the app attempts to fetch a statically published JSON-formatted file whose name is programmatically constructed as {geo-type}-{business}-{year}.json.
 
Where:
- Geo-type type is either 'census' or 'neighborhood'.
- Business is one of the following (each representing a selection in the drop-down): 'animal-care', 'bicycle-messenger', 'grocery', 'manufacturing', 'massage', 'not-for-profit-club', 'public-garage', 'pawnbroker', 'peddler', 'raffles', 'retail-food', 'shared-kitchen', 'tavern', 'tobacco', 'valet-parking-operator',  or 'weapons'.
- Year is the selected four digit year, for example '2007'

Example filenames would be: 'neighborhood-animal-care-2007.json', 'census-grocery-2013.json', and 'census-peddler-2004.json'.
 
Each of these files are formatted as a JSON “dictionary” object containing a property whose name matches every area ID in the given geography type (i.e., corresponding to every row in the aforementioned boundary Fusion tables). For census files, there should be 801 entries with properties named after the 10-digit tract identifier like ‘17031842400’; for neighborhood files, there should be 77 entries with properties like “EDISON PARK” and “ENGLEWOOD”. Each area ID property holds a reference to an object containing desertification information about the corresponding area. The app joins this desertification data with the area boundary (fetched from Fusion Tables) using the area ID as the foreign key.
 
For example, a neighborhood data file would look like:

```
{
    "EDISON PARK":  { "ACCESS_INDEX":0.211987016},
    "LINCOLN PARK": { "ACCESS_INDEX":0.199903484},
    …
}
``` 
 
… and a census tract file would look like:
 
``` 
{
    "17031839000": { "ACCESS_INDEX":0.048146609},
    "17031080202": { "ACCESS_INDEX":0.052403459},
    …
}
``` 

The "ACCESS_INDEX" property should contain a numeric value representing the relative level of desertification for the corresponding area relative to every other area. The ACCESS_INDEX values are an abstract (they have no units) relative measure of business accessibility in the corresponding area and may contain any numeric value in the range of 0..MAX_SAFE_INT. At runtime, the application will determine the range of values in the dataset and, for each area, calculate its percent penetration into the range. This "penetration" value is then used to assign a shade. 

#### Critical Business Lists

A critical business is one whose demise would create a desert for a significant population (i.e., it's the only business of a given type for quite some distance).

To render markers on the map illustrating critical businesses for each license type and year, we use a file for each license type for each year. These files should be named critical-{business}-{year}.json where {business} and {year} are defined the same as for accessibility indices. There is no need to partition this data on a per-tract or per-community basis; the marker list is valid for the entire city.
 
Each of these files should define a single array containing zero or more "marker" objects consisting of a latitude, longitude and business name. For example:

```
[
    {"lat": "41.8822664",
     "lng": "-87.6363718",
     "name": "STA Group, LLC"},
    …
]
```

### FAQs

- How were the community and census tract Fusion tables created? The City of Chicago Data Portal (HERE) provides this information in KML format (keyhole markup language, an XML schema used to represent geo-spacial data). Unfortunately, KML isn't particularly friendly for applications like ours. The metadata associated with each area (for example, the neighborhood name or census tract id) is stored in an HTML fragment that CDATA'd in the XML. In order to create a more useable representation, we wrote a small Groovy script to export the useful bits into CSV format, which was then uploaded to Fusion.

- Why is the boundary data in a Fusion Table? It shouldn't be. There's no good reason for this other than legacy: When we started development the notion was that we'd use Fusion Tables as our primary database. We eventually migrated the other data away from Fusion, but haven't gotten around to moving the polygons out. 

- How are the polygons shaded? 

For more information about using Node.js on Heroku, see these Dev Center articles:

- [Getting Started with Node.js on Heroku](https://devcenter.heroku.com/articles/getting-started-with-nodejs)
- [Heroku Node.js Support](https://devcenter.heroku.com/articles/nodejs-support)
- [Node.js on Heroku](https://devcenter.heroku.com/categories/nodejs)
- [Best Practices for Node.js Development](https://devcenter.heroku.com/articles/node-best-practices)
- [Using WebSockets on Heroku with Node.js](https://devcenter.heroku.com/articles/node-websockets)
