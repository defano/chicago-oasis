# Oasis Chicago

Oasis Chicago was created as a submission to ChallengePost's Big Data for Social Good competition. You can read more--and watch a video--about the goals of and inspiration for the project on the [ChallegePost project page](http://challengepost.com/software/oasis). 

Oasis is a trivial [Node.js](http://nodejs.org/) application; it uses the Express framework for routing requests to static resources but otherwise doesn't expose web services or consume external data sources (like a database). 

The application's user interface is based on Bootstrap/jQuery and makes use of the `awesome-bootstrap-checkbox`, `bootstrap-multiselect`, and `seiyra-bootstrap-slider` plugins. The Express application makes use of the Jade templating engine and the `marked` (a markdown rendering library) for displaying the about page.

## Running the App

### Running Locally

Make sure you have [Node.js](http://nodejs.org/) and the Node Package Manager (npm) installed.

```sh
$ git clone git@github.com:defano/oasis-chicago-njs.git # or clone your own fork
$ cd oasis-chicago-njs
$ npm install
$ npm start
```

The app should now be running on [localhost:5000](http://localhost:5000/).

### Running on Docker

Users have two options when running the application on Docker. Use the pre-built image available in the Docker Repository:

```sh
$ docker pull defano/desert-chicago-njs
$ docker run -p 80:5000 defano/desert-chicago-njs
```

Or, pull down the source code and create your own image:

```sh
$ git clone git@github.com:defano/oasis-chicago-njs.git
$ cd oasis-chicago-njs
$ docker build -t your-app-tag-here .
$ docker run -p 80:5000 your-app-tag-here
```

The app should now be running on [localhost](http://localhost).

### Deploying to IBM Bluemix

Make sure you have the Cloud Foundry command line tools installed.

```sh
$ cf login # provide Bluemix authentication credentials
$ cf push desert-chicago-njs
```

### Deploying to Heroku

This GitHub repository is configured for continuous delivery to Heroku; any changes pushed to the master branch will result in the app being redeployed on the Heroku cloud.

That said, you can fork this code and deploy it to your own Heroku environment. Make sure you have the [Heroku Toolbelt](https://toolbelt.heroku.com/) installed:

```sh
$ heroku create
$ git push heroku master
$ heroku open
```

## Documentation

### Data Sources

The application utilizes four datasets:

- Neighborhood (77 officially recognized "community areas") and census tract boundaries
- Desertification indicies for each census tract and community per business type per year
- Critical businesses for each business type per year
- Socioeconomic data (income and poverty) for each neighborhood

#### Community and Census Tract Boundaries

As the application initializes, it queries two Google Fusion tables to fetch the neighborhood and census tract polygons that it will render on the map.

This data consists of one table for census tracts, and another for community areas. Each table has three columns: `ID`, `NAME` and `GEOMETRY`. For both tables, the `GEOMETRY` column contains a "MultiGeometry" KML fragment representing the area's polygon boundary and centroid (see the FAQs for a discussion of how this was created). For the census table, the `ID` column represents the 10-digit census tract number (a nationally-unique value). The `NAME` column contains the more human-readable, dotted-decimal tract name (unique only within the ciy). Within the community table, the `NAME` and `ID` columns both contain the officially recoginized community name (for example, "LINCOLN PARK" or "DOUGLAS").

#### Desertification Indicies

Each time the user changes the selection of business, year, and geography type, the app attempts to fetch a statically published JSON-formatted file whose name is programmatically constructed as `{geo-type}/{business}-{year}.json`.
 
Where:
- Geo-type type is either `tracts` or `commareas`.
- Business is Chicago business license type, for example `animal-care-facility` or `day-care-center-under-2-years`.
- Year is the selected four digit year, for example `2007`

Example filenames would be: `neighborhood-animal-care-2007.json`, `census-grocery-2013.json`, and `census-peddler-2004.json`.
 
Each of these files are formatted as a JSON array containing a single object for each area ID in the given geography type (i.e., corresponding to every row in the aforementioned boundary Fusion tables). For census files, there exist 801 elements in the array, and each object contains a property called `TRACT` containing the dotted-decimal census tract for which the data applies (i.e., `8107`); for neighborhood files, there exists 77 elements in the array with a `COMMUNITY AREA` property containing the name of the corresponding neighborhood (like `EDISON PARK` and `ENGLEWOOD`). Each object contains desertification information about the corresponding area in a property called `ACCESS1` (additional "access" measurements may be present in the data; we ignore these). The app joins this desertification data with the area boundary (fetched from Fusion Tables) using the area ID as the foreign key.

Additionally, within the census tract records we find properties containing the number of businesses that are located within one mile, two miles and three miles. These properties are called `ONE_MILE`, `TWO_MILE` and `THREE_MILE`, respectively.
 
For example, a neighborhood data file would look like:

```
[
    {"COMMUNITY AREA" : "EDISON PARK", "ACCESS1" : 0.211987016},
    {"COMMUNITY AREA" : "LINCOLN PARK", "ACCESS1" : 0.199903484},
    …
]
``` 
 
… and a census tract file would look like:
 
``` 
{
    {"TRACT" : "2406", "ACCESS1" : 0.211987016, "ONE_MILE" : 3, "TWO_MILE" : 14, "THREE_MILE" : 27},
    {"TRACT" : "0310", "ACCESS1" : 0.199903484, "ONE_MILE" : 1, "TWO_MILE" : 6, "THREE_MILE" : 11},
    …
}
```

JSON structures may contain additional data/properties, but only those described here are used by the application. 

The `ACCESS1` property should contain a numeric value representing the relative level of desertification for the corresponding area relative to every other area. These values represent the abstract level of access a resident of the area has to businesses of the corresponding type; valid values are in the range of 0..MAX_INT. At runtime, the application will determine the range of values in the dataset, and, for each area, calculate its percent penetration into the range. This "penetration" value is then placed into one of five buckets and the bucket value is used to assign a shade. 

#### Critical Business Lists

A critical business is one whose demise would create a desert for a significant population (i.e., it's the only business of a given type for quite some distance).

To render markers on the map illustrating critical businesses for each license type and year, we use a file for each license type for each year. These files should be named `critical-{business}-{year}.json` where `{business}` and `{year}` are defined the same as for accessibility indices. There is no need to partition this data on a per-tract or per-community basis; the marker list is valid for the entire city.
 
Each of these files should define a single array containing zero or more "marker" objects consisting of a latitude, longitude and business name. For example:

```
[
    {"LATITUDE": "41.8822664",
     "LONGITUDE": "-87.6363718",
     "DOING_BUSINESS_AS_NAME": "STA Group, LLC"},
    …
]
```

### FAQs

- **How were the community and census tract Fusion tables created?** The [City of Chicago Data Portal](https://data.cityofchicago.org/) provides this information in KML format (keyhole markup language, an XML schema used to represent geo-spacial data). Unfortunately, KML isn't particularly friendly for applications like ours. The metadata associated with each area (for example, the neighborhood name or census tract id) is stored in an HTML fragment that CDATA'd in the XML. In order to create a more useable representation, we wrote a small Groovy script to export the useful bits into CSV format, which was then uploaded to Fusion.

- **Why is the boundary data in a Fusion Table?** It shouldn't be. There's no good reason for this other than legacy: When we started development the notion was that we'd use Fusion Tables as our primary database. We eventually migrated the other data away from Fusion, but haven't gotten around to moving the polygons out. 

- **Why do I sometimes see two or more critical businesses near one another? This would seem to violate the concept, wouldn't it?** It may seem to violate the concept, but in fact it doesn’t. Imagine two businesses separated by a block, east and west of one another. Since we define a critical business to be one that serves a large population within one mile of its location, it’s possible that closing the east business would put the corresponding eastern population at a distance of more than a mile from the western business--even if by only one block.

- **When relative shading is enabled, I notice the areas near the boundaries of the map sometimes lose their shading altogether. Is this a bug?** When relative shading is enabled, only those areas visible on the map are shaded (the rest are unshaded). “Visible” in this context means that the center (centroid) of the area is visible on the map. If the center of the area is not within the map’s viewable boundaries, then the entire area--including the portion which is visible--loses shading.

- **How are the levels of desertification determined? How does an area colored light blue differ from one colored dark blue?** The shades represent the relative accessibility of a given business type compared to accessibility in other areas of the city. This formula sometimes produces what might be considered misleading conclusions. Take, for example, hotels in the city: because we find such a large percentage of all the city’s hotels in the downtown area, outlying neighborhoods appear universally as deserts, even though a more nuanced consideration of what constitutes a “hotel desert” might reach a different conclusion.

- **Some census tracts are shaded gray. What does this mean?** It means that we either don’t have data for the area and cannot make a determination of its level of desertification, or there's an internal problem with the app. Try refreshing the page on your browser.

- **Why is the range of selectable years inconsistent across business types?** This is a limitation of our source data. For a variety of reasons, the City of Chicago does not publish business license data across a consistent range of years.

- **What made you choose the selection of business types? I'd rather be able to see deserts of [insert-your-favorite-business-type-here].** We agree, but our data is based on business license categories issued by the City of Chicago. Each selection in the menu represents a different type of business license, which may or may not always be interesting to an application like ours.

One exception: The city produced a special dataset for grocery stores (even though grocery stores are licensed within a more broad license category--”retail food”).

- **When I click a critical business marker, why isn't the street view always oriented towards the corresponding business?** In our humble opinion, this is a “limitation” (we won't call it a bug, nudge-nudge) in Google’s internal street view logic. There are some available workarounds, but they were deemed too complicated for this effort. Our apologies.

- **Why does the street view sometimes show an address/area that doesn't appear to have anything to do with the business in question?** The markers (and street views) are based on the latitude and longitude associated with the license. In some cases the business license may be addressed to an owner’s residence or a holding company, even if the product or service is being offered elsewhere. (Think of food trucks, peddlers, and similarly mobile businesses...)
