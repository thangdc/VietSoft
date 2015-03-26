var fb = new Firebase("https://vietsofts.firebaseio.com/");

function generateqr(data) {
	$('#loading').show();
	var encoding = $('#enc').val();
	
	var qrcode = fb.child('QRCode');
	qrcode.push({ data: data, date: new Date().toString() });
	
	var data = encodeURIComponent(data);
	
	// Generate the URL (Get current domain self.request.path
	var curl = 'http://albumdownloader.apphb.com/TienIch/QRCodeGeneratorImage?content=' + data + '&width=' + $('#x').val() + '&height=' + $('#y').val();

	// Change the image
	$('.imgpreview').attr('src', curl).load(function() {
		$('#loading').hide();
	});

}
function initialize() {
    var myLatlng = new google.maps.LatLng(11.400947, 105.934639);

	var myOptions = {
		zoom : 8,
		center : myLatlng,
		mapTypeId : google.maps.MapTypeId.ROADMAP
	}

	var map = new google.maps.Map(document.getElementById("map_canvas"),
			myOptions);

	var marker = new google.maps.Marker({
	    position: new google.maps.LatLng(10.78778,106.662483),
				clickable : true,
				draggable : true,
				map : map
			});

	google.maps.event.addListener(marker, 'drag', function() {
		lat = Math.round(marker.position.lat() * 1000) / 1000;
		lng = Math.round(marker.position.lng() * 1000) / 1000;
				
		$('#coord').data('lat', lat).data('lng', lng);
		$('#coord').text('Latitude(' + lat + ') Longitude(' + lng + ')');
	});
}
$(document).ready(function () {
    // Regular Expression patterns
    var regdigit = /(^-?\d\d*$)/;
    var regmail = /(^[a-z]([a-z_\.]*)@([a-z_\.]*)([.][a-z]{3})$)|(^[a-z]([a-z_\.]*)@([a-z_\.]*)(\.[a-z]{3})(\.[a-z]{2})*$)/i;

    $('#myTabs a').click(function (e) {
		e.preventDefault()
		$(this).tab('show')
	});
	
    // Hide Loading
    $('#loading').hide();

    // Generate Qr Code
    $('#gqr').click(function () {
        var ind = $("ul#myTabs li.active").index();
        if (ind == 0) {
            generateqr($('#textarea1').val());
        } else if (ind == 1) {
            data = 'smsto:' + $('#phone').val() + ':' + $('#textarea2').val();
            generateqr(data);

        } else if (ind == 2) {
            data = 'MATMSG:TO:' + $('#address').val() + ';SUB:'
					+ $('#subject').val() +';BODY:'+ $('#textarea3').val() +';;';
            generateqr(data);
        } else if (ind == 3) {
            data = 'tel:' + $('#phone_number').val();
            generateqr(data);
        } else if (ind == 4) {
            data = 'MECARD:N:' + $('#contact_name').val() + ';TEL:'
					+ $('#contact_phone').val() + ';URL:'
					+ $('#contact_website').val() + ';EMAIL:'
					+ $('#contact_email').val() + ';ADR:'
					+ $('#contact_address').val() + ';;';
            generateqr(data);
        } else if (ind == 5) {
            data = 'geo:' + $('#coord').data('lat') + ','
					+ $('#coord').data('lng');
            generateqr(data);
        }
        else if (ind == 6) {
            data =  $('#link').val();
            generateqr(data);
        }
    });

    /*
    * Input Checking
    */

    // Character Count
    $('#textarea1').keyup(function () {
        var numcount = $('#textarea1').val().length;

        $('#text2encode').text(numcount);
    });

    $('#textarea2').keyup(function () {
        var numcount = $('#textarea2').val().length;

        $('#messagebox').text(numcount);
    });

    $('#textarea3').keyup(function () {
        var numcount = $('#textarea3').val().length;

        $('#mailbox').text(numcount);
    });

    // Phone number check
    $('#phone').keyup(function () {
        var phonenumber = $('#phone').val();
        var numcount = phonenumber.length;

        // check if digit

        if (regdigit.test(phonenumber)) {
            $('#phonenumberbox').text(numcount);
        } else {
            $('#phonenumberbox').html('<span style="color:red">!</span>');
        }
    });

    // mail address check

    $('#address').keyup(function () {
        var address = $('#address').val();
        var numcount = address.length;

        // check if mail

        if (regmail.test(address)) {
            $('#mailadr').text(numcount);
        } else {
            $('#mailadr').html('<span style="color:red">!</span>');
        }
    });
	
	$('#subject').keyup(function () {
        var subject = $('#subject').val();
        var numcount = subject.length;
		$('#mailsub').text(numcount);
    });
    // Load Map
    initialize();

});
