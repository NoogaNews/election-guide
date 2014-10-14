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
                            '<p class="text-center" ><small>' + 
                                '{{ title }}</a><br>' + 
                                '{{ #party }}{{ party }}<br>{{ /party }}' + 
                                '{{ #incumbent }}<em>Incumbent</em>{{ /incumbent }}' + 
                            '</small></p>' + 
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
    
    
    $('#button').click(function() {

        // googleAPIKey = $('#voterformjs').data('civic-api-key');

        street  =  $('#streetAddress').val();
        city    =  $('#city').val();
        zipCode =  $('#zipCode').val();
        state   =  'TN'; // Derive from ZIP code
        
        // Form validations
        if (street == '') { 
            // Form error
            return ; 
        }  
        if (zipCode == '') { 
            // Form error
            return ; 
        }
        // Hide form
        $('#voter-form').hide();

        // Remove default address after testing
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
        var html = Mustache.to_html(template, races);
        var node = document.getElementById("voter-races");
        node.innerHTML = html;
    };

})(jQuery, Mustache);


