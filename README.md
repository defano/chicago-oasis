# Chicago Oasis

A visualization of business accessibility to residents of every neighborhood and census tract in the City of Chicago. Refer to the [Chicago Oasis Data](https://github.com/defano/chicago-oasis-data) project for information about how the analysis was performed.

Chicago Oasis was originally created as a submission to ChallengePost's Big Data for Social Good competition (it took third place). You can read more--and watch a video--about the goals and inspiration for this project on the [ChallegePost project page](http://challengepost.com/software/oasis).

Chicago Oasis is a trivial [Node.js](http://nodejs.org/) application that uses the Express framework for routing requests to static, precomputed analysis files in the `public/json/` directory. It does not utilize a database. The application serves a web front-end based on Bootstrap/jQuery that makes use of the `awesome-bootstrap-checkbox`, `bootstrap-multiselect`, `seiyra-bootstrap-slider` plugins, plus the Jade templating engine and `marked` (Markdown rendering library).

### Related Projects

* [Chicago Oasis Data](https://github.com/defano/chicago-oasis-data) - The data analysis scripts (written in Python) that pull down and analyze source data from the City of Chicago and US Census Bureau. Based on Ben Galewsky's original [Apache Pig implementation](https://github.com/BenGalewsky/oasis).
* [Chicago Oasis iOS](https://github.com/defano/chicago-oasis-ios) - A native iOS application written in Swift for visualizing the data served by this application. Available in the Apple App Store.

## Running the App

This application requires [Node.js](http://nodejs.org/) and the Node Package Manager (`npm`). Assure these tools are available in your environment, then:

1. Clone this repository:
```
$ git clone https://github.com/defano/chicago-oasis
```
2. Navigate into the project directory:
```
$ cd chicago-oasis/
```
3. Install required NodeJS packages:
```
$ npm install
```
4. Finally, fire up the server:
```
$ npm start
```

The app should now be running on [localhost:5000](http://localhost:5000/).

### Deploying to Heroku

This GitHub repository is configured for continuous delivery to Heroku; any changes pushed to the master branch will result in the app being redeployed on the Heroku cloud (accessible via http://chicago-oasis.org).

That said, the project contains a `Procfile` so you can fork this repository and deploy it to your own Heroku environment. Make sure you have the [Heroku Toolbelt](https://toolbelt.heroku.com/) installed:

```
$ heroku create
$ git push heroku master
$ heroku open
```

## FAQs

#### When relative shading is enabled, I notice the areas near the boundaries of the map sometimes lose their shading altogether. Is this a bug?
Not a bug. When relative shading is enabled, only those areas visible on the map are shaded (the rest remain unshaded). _Visible_ in this context means that the center (centroid) of the area is visible on the map. If the center of the area is not within the map’s viewable boundaries, then the entire area--including the portion which is visible--loses its shading.

#### How are the levels of desertification determined? How does an area colored light blue differ from one colored dark blue?
The shades represent the relative accessibility of a given business type compared to accessibility in other areas of the city. This formula sometimes produces what might be considered misleading conclusions. Take, for example, hotels in the city: because we find such a large percentage of all the city’s hotels in the downtown area, outlying neighborhoods appear universally as deserts, even though a more nuanced consideration of what constitutes a “hotel desert” might reach a different conclusion.

#### Some census tracts are shaded gray. What does this mean?
It means that we either don’t have data for the area and cannot make a determination of its level of desertification, or there's an internal problem with the app. Try refreshing the page on your browser.

#### Why is the range of selectable years inconsistent across business types?
This is a limitation of our source data. For a variety of reasons, the City of Chicago does not publish business license data across a consistent range of years.

#### What made you choose the selection of business types? I'd rather be able to see deserts of [insert-your-favorite-business-type-here].
We agree, but our data is based on business license categories issued by the City of Chicago. Each selection in the menu represents a different type of business license, which may or may not always be interesting to an application like ours.<br><br>One exception: The city produced a special dataset for grocery stores (even though grocery stores are licensed within a more broad license category: "retail food").

#### When I click a critical business marker, why isn't the street view always oriented towards the corresponding business?
In our humble opinion, this is a “limitation” (we won't call it a bug, nudge-nudge) in Google’s internal street view logic. There are some available workarounds, but they were deemed too complicated for this effort. Our apologies.
