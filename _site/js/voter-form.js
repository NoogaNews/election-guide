//
(function($, Mustache) {
    
    var
    street,
    city,
    zipCode,
    state,
    address,
    divisions,
    races     = {'races':[]},
    // Mustache template inserted in div#races
    template  = // Race profile
                '{{ #races }}<div id="{{ div_id }}" class="large-12 columns">' +
                    '<h3>{{ race_name }}</h3>' +
                    '<p>{{ description }}</p>' +
                    
                    // Candidates
                    '<div class="row" data-equalizer>' +
                        '{{ #candidates }}' + 
                        '<div class="large-6 medium-6 small-12 panel columns left" data-equalizer-watch style="background:none;border:none">' + 
                            '<a href="./candidates/{{ name_slug }}"><img src="./img/{{ image }}" class="left">' +
                            '<p class="text-center" >' + 
                                '{{ title }}</a><br>' + 
                                '{{ #party }}{{ party }}<br>{{ /party }}' + 
                                '{{ #incumbent }}<em>Incumbent</em>{{ /incumbent }}' + 
                            '</p>' + 
                        '</div>' +
                        '{{ /candidates }}' +
                    '</div>' + 

                    // Ballot measures
                    '<div class="row">' + 
                        '{{ #propositions }}' +
                        '<div class="large-12 columns">' + 
                            '<p><strong>{{ title }}</strong><br>' + 
                            '{{{ description }}}</p>' + 
                        '</div>' + 
                        '{{ /propositions }}' + 
                    '</div>' +

                    '<hr />' +
                '</div>{{ /races }}',

    googleAPIKey = $('#voterformjs').data('civic-api-key')
    ;
    
    // Submit form
    $('#button').click(function() {
        street  =  $('#streetAddress').val();
        city    =  $('#city').val();
        zipCode =  $('#zipCode').val();
        state   =  'TN'; // Derive from ZIP code
        
        // street and ZIP required
        if (street == '') { 
            return ; 
        }  
        if (zipCode == '') { 
            return ; 
        }

        address = [street, city, state, zipCode].join(' ');

        callAPI();
    });

    function callAPI() {
        gapi.client.setApiKey(googleAPIKey);

        var req = gapi.client.request({
            'path'   : '/civicinfo/v1/representatives/lookup', 
            'method' : 'POST',
            'params' : {'includeOffices' : 'false'},
            'body'   : {'address' : address} 
        });

        req.execute(parseAPIResponse);
    };

    function parseAPIResponse(results) {
        if (results.status === 'success') {
            divisions = results.divisions;
            selectRaces();
        }
    };

    // Compare API results to full list of races
    function selectRaces(){
        $.getJSON('api/races.json', function(data) {
            for (var ocdid in divisions) {
                for (var i in data) {
                    if (ocdid == data[i]["ocdid"]) {
                        races['races'].push(data[i]);
                    }
                }
            }
            sortBallot();
            writeToDOM();
        });
    };

    // Sort ballot by race_id
    function sortBallot() {
        races['races'].sort(function(a, b) {
            var sortKey = 'race_id';
            if (a[sortKey] < b[sortKey]) {
                return -1;
            } else if (a[sortKey] > b[sortKey]) {
                return 1;
            } else {
                return 0;
            }
        });
    };

    function writeToDOM() {
        // Hide form
        $('#voter-form').hide();

        var html = Mustache.to_html(template, races);
        var node = document.getElementById("voter-races");

        node.innerHTML = html;
        history.pushState(races,'Races','#races');
    };

    // Check history
    $(document).ready(function() {
        
        if (history.state.races.length > 0) {        
            races['races'].length = 0;
            races['races'] = history.state.races;

            writeToDOM();
        }
    });

})(jQuery, Mustache);


