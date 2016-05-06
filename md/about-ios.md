# Chicago Oasis for iOS

Everyone who lives in an urban environment deserves convenient access to businesses that serve their basic needs. In 1995, urban planners and public health researchers began studying the problem of food deserts in cities, areas where residents lack a grocery store within one mile of their homes.

Access to food is clearly a basic need, a need filled by grocery stores. What other types of business fill other basic needs in people’s lives? The Oasis team wanted to see if it would be possible to analyze the City of Chicago’s database of business licenses to study other essential needs and the business types that fill them and to identify any deserts that exist for those businesses.

Chicago Oasis was created by Matt DeFano and Ben Galewski in association with STA Group, LLC and with special thanks to Bill Casperson.

# Frequently asked questions

#### What do the colors on the map mean?

Each bordered area on the map (neighborhood or census tract) is shaded blue to represent its level of accessibility to businesses of the selected license category. Darker blue indicates greater access; lighter blue indicates less.

For a more rigorous definition of accessibility; how it was calculated; and how it affects the map, see our technical description on this page.

#### What is a critical business?

A critical business is the only business of its licensed type to serve a large population within a one mile radius of its location.

We consider such businesses "critical" because their closure would render the surrounding area a desert for that type of business.

#### What does relative shading do?

Relative shading colors each bordered area based only on the relative accessibility of other areas visible on the map, and not relative to the city as a whole. As such, you'll see the shade assigned to a given area change as you scroll or zoom the map.

When relative shading is turned off each area is shaded based on its accessibility relative to all other areas of the city (irrespective of whether they're presently visible). For specialized businesses that are limited in number or otherwise not distributed throughout the city, this coloring scheme has the effect of highlighting one or two areas in dark blue (high accessibility) leaving the rest of the city appearing to be a desert.

#### Why does it take so long for the app to start?

A couple things happen when you start the app: First, the software has to build a polygon representing each neighborhood and census tract's boundaries. Fun fact: The map renders 77 neighborhoods polygons comprised of 50,964 sides, and 801 census tracts consisting of 97,611 sides. Give it a minute. It's going to space. Secondly, the app fetches a list of available license types and the set of socioeconomic data for all of Chicago's neighborhoods.

The first time the app is run (after installing it) it saves the neighborhood and census tract polygons to your phone's storage to reduce startup time in subsequent uses.

#### Why I do I sometimes see two or more critical businesses near one another? This would seem to violate the concept of a business being "critical", wouldn’t it?

It does seem to violate the concept, but these are not erroneous given the rigidity of the mathematics behind our definition of "critical business."

Imagine two businesses separated by a single block east and west of one another. Since we define a critical business to be one that serves a large population within exactly one mile of its location, it’s possible that closing the east business would put the corresponding eastern population at a distance of more than a mile from the western business--even if by only one block.

#### How are the levels of desertification determined? How does an area colored light blue differ from one colored dark blue?

The shades represent the relative accessibility of a given business type compared to  accessibility in other areas of the city.

This formula sometimes produces what might be considered misleading conclusions. Take, for example, hotels in Chicago: because we find such a large percentage of all the city’s hotels in the downtown area, outlying neighborhoods appear universally deserted, even though a more nuanced consideration of what constitutes a “hotel desert” might reach a different conclusion.

The relative shading feature was custom built for this scenario: Zoom in to an interesting area of the city and see how the neighborhoods or census tracts in that area compare only to one another and not to the city at large.

#### Some census tracts are shaded gray. What does this mean?

It means that we don’t have data for the area and cannot make a determination of its level of desertification.

You may see an area temporarily shaded gray. During this time the app processing data for the area and it will become blue when ready.

#### Why is the range of selectable years inconsistent across business types?

This is a limitation of our source data. For a variety of reasons, the City of Chicago does not publish business license data across a consistent range of years.

#### What made you choose the selection of business types? I’d rather be able to see deserts of *insert-your-favorite-business-here*.

We agree, but our data is based on business license categories issued by the City of Chicago. Each selection in the menu represents a different type of business license that the city offers, which may or may not be interesting to an application like ours.

One exception: The city produced a special dataset for grocery stores (even though grocery stores are licensed under a more broad category--”retail food”).

#### Why does a critical business appear to be located at an address that doesn’t seem to have anything to do with it?

The critical business markers are based on the street address listed on the license. In some cases the business license may be addressed to an owner’s residence, office or holding company that is geographically separated from where the product or service is being offered. (Think of food trucks, peddlers, and other mobile businesses...)

Of course, this represents a notable limitation in the analysis of data like this. The presence or absence of a licensed business within a geographical area may not always correspond to a real desert (or oasis) of such products or services when offerings are made outside of the licensed business address.

#### This is really neat. Can you make this for my city or suburb, too?

Thanks! Our source data originates from the City of Chicago's data portal. Provided your city or town makes the same kinds of data available, then it's certainly possible.

That said, we encourage interested parties to fork the Chicago Oasis open source projects and build upon them for their own uses.

# How does it work?

The accessibility analysis starts with a dataset from the City of Chicago’s data portal that documents every business license issued since 2006 (with some licenses going as far back as 1995) and includes the business’s name, address, GPS coordinates and business license type.

We then downloaded data identifying all of the 801 census tracts within the city along with the 2010 population counts and coordinates of each tract’s centroid (center point) from the U.S. Census Bureau's website. This data was enriched with a mapping of census tract to one of the city’s officially recognized 77 community areas (neighborhoods).

These raw datasets were uploaded to IBM’s Bluemix cloud computing environment where they were analyzed with scripts written in Apache’s Pig Latin language to compute critical businesses and accessibility indices for each license type across each census tract and community area. A critical business is the only business of its type serving a given population. If a critical business closes, thousands of people are left in a desert.

Finally, for consumption in Javascript, the tabular data generated in the Bluemix environment was transformed into JSON using the open-source ETL tool, Pentaho Data Integration.

Neighborhood and census tract geospatial data was similarly retrieved from the Chicago data portal in KML format. Transformations on the KML data to normalize placemark names were applied using a simple Groovy script. The resulting KML was then uploaded to Google Fusion Tables where it is served to web clients and overlaid on the displayed Google Map. For the native iOS app, the normalized area data was exported from Fusion Tables and imported into the application bundle as a KML resource. On initial startup, the app parses this KML to generate MapKit overlay polygons. (These MapKit overlays are then serialized and saved to app cache for faster subsequent startup times.) Each polygon is identified by an area ID that services as a "primary key" used to join it with accessibility and socioeconomic data.

#### How we calculated accessibility indices

For each census tract we calculate the set of all businesses (for each licensed type) within three miles of the geographic center (centroid) of the census tract. Each business is then assigned a accessibility weight equal to one over its distance from the centroid. The census tract's accessibility index is equal to the sum of the accessibility weight of each business (within three miles).

Pseudo-Code for this algorithm might look like:

```
foreach license_type in chicago_license_categories {
  foreach census_tract in chicago_census_tracts {
    let access_index = 0    
    foreach business in chicago_businesses {
      if (business.distanceFrom(census_tract.centroid) < 3.miles) {
        access_index += 1/business.distanceFrom(census_tract.centroid)
      }
    }
    census_tract.accessibility = access_index
  }
}    
```

For each neighborhood we determine the set of census tracts enclosing it (a census tract is considered within a neighborhood if the tract's centroid intersects the neighborhood's boundaries). The accessibility index of the neighborhood is equal to the arithmetic mean of the accessibility indices of its census tracts.  

```
foreach license_type in chicago_license_categories {
  foreach neighborhood in chicago_neighborhoods {
    foreach census_tract in chicago_census_tracts {
      let neighborhood_tracts = []
      if (census_tract.centroid.isWithin(neighborhood.boundaries)) {
        neighborhood_tracts.add(census_tract)
      }
    }
    neighborhood.accessibility = averageOf(neighborhood_tracts.accessibility)
  }
}
```

#### How we shade the map

First we determine the maximum and minimum range of accessibility indices across all areas on the map (or, when relative shading is enabled, only those areas visible on the map). Then, to assign a shade to an area we compare that area's accessibility index to the range of possible indices to calculate a percent of penetration into the range. Finally, to produce a map with five distinct shades, we bucket the percent penetration value by rounding it to it's closest twentieth percentile and assign this value to the area's alpha color component.

```
let bucket_size = 0.20    // Five buckets
let percent_penetration = (this_area.index - min_index) / (max_index - min_index)
let alpha = round(percent_penetration / bucket_size) * bucket_size
```

# Credits and Legal

"Oasis" app icon was derived from an icon made by [Baianat](http://www.flaticon.com/authors/baianat) from [www.flaticon.com](www.flaticon.com) and is licensed under [Creative Commons BY 3.0](http://creativecommons.org/licenses/by/3.0/)
