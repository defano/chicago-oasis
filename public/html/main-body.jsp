<div class="main-content">
<div class="control-panel float-bottom-container">
    <div class="well">
        <h4>Show deserts of</h4>
        <div class="indented">
            <select id="business-multiselect" multiple="multiple">
                <option value="Grocery">Grocery</option>
                <option value="Pharmacy">Pharmacy</option>
                <option value="Tavern">Tavern</option>
                <option value="Bearded men in skinny jeans">Bearded men in skinny jeans</option>
            </select>
        </div>
        <h4 class="vert-break">Within each</h4>
        <div class="btn-group indented" data-toggle="buttons">
            <label class="btn btn-primary active"> <input type="radio" name="neighborhood" id="neighborhood-radio"> Neighborhood
            </label> <label class="btn btn-primary"> <input type="radio" name="census" id="census-radio" checked="checked"> Census Tract
            </label>
        </div>
        <h4 class="vert-break">For calendar year</h4>
        <div class="indented">
            <input id="year-slider" type="text" value="2007" data-slider-min="2000" data-slider-max="2014" data-slider-step="1" data-slider-value="2007"
                data-slider-orientation="horizontal" data-slider-selection="after" data-slider-tooltip="hide"><span id="year-value" class="label label-default indented">2007</span>
        </div>
    </div>
    <div class="big-vert-break info-panel float-bottom">
        <h3>
            <span class="glyphicon glyphicon-map-marker" aria-hidden="true"></span> <span class="area-name">LINCOLN PARK</span>
        </h3>
        <p class="area-subtitle">Least deserted</p>
        <p>
            In 2007, <span class="area-name">Lincoln Park</span> had an average of <b>3 grocery stores within one mile</b> of every resident, 5 grocery stores within two miles, and 9 grocery stores within three
            miles.
        </p>
        <p>By comparison, residents city-wide had 2.1 grocery stores within one mile, 4 grocery stores within two miles, and 6 grocery stores within three miles.</p>
        <br>
        <p>
            <span class="area-name">Lincoln Park</span> is the <b>4th wealthiest</b> community in Chicago and the <b>2nd least deserted</b> for food.
        </p>
    </div>
</div>
<div class="map-panel">
    <div id="map-canvas"></div>
</div>
</div>