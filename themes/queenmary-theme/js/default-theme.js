
// Toggle visibility of the menu
$('.nav-toggle').click(function () {
    $(".nav-toggle").toggleClass("collapsed");
    $(".navWrapper nav").slideToggle("slow", function () {});
//    $("body").toggleClass("noScroll");
});

$('.custom-menu-toggle').click(function () {
    $(this).parent().find('.custom-menu').toggleClass('active');
    return false;
});

var windowWidth = $(window).width();

if (windowWidth <= 880) {
    $(".mainSectionWrapper #GalleryList li img").each(function () {
        var source = $(this).attr("src");
        $(this).parent("a").css({
            'backgroundImage': 'url(' + source + ')'
        });
    });
    $('header .top-bar').appendTo(".mobile-top-menu");

    var mobile_nav_hgt = $('.navWrapper').height();
//    $('.mainSectionWrapper').css('margin-top', mobile_nav_hgt);
    $('.navWrapper nav').css('top', mobile_nav_hgt);


//    mobile dropdown show on click
    $('.navWrapper nav > ul > li > a').on('click', function (e) {
        $(this).next('.dropdown').slideToggle();
        return false;
    });

}

var hgtTopBar = $('header').height();

$(function () {
    $('.navWrapper').css('top', hgtTopBar);

    //add banner to page
    $('.banner').each(function () {
        if ($(this).find('img').length) {
            var imgSrc = $(".banner img").attr("src");
            $(this).css({
                'backgroundImage': 'url(' + imgSrc + ')'
            });
        }
    });
});


$(window).load(function () {
    scrolling();
});


$(window).scroll(function () {
//    console.log(scroll);
    scrolling();
});

function scrolling() {
    var scroll = $(window).scrollTop();
//    add class when scrolling
    if (scroll > 5) {
        $('.navWrapper').addClass("stickyHeader");
        $('.navWrapper').css('top', 0);
    } else {
        $('.navWrapper').removeClass("stickyHeader");
        $('.navWrapper').css('top', hgtTopBar);
    }
}


//contact map
function initMap() {
    var center = {lat: 51.4225552, lng: -0.4518411};
    var map = new google.maps.Map(document.getElementById('map'), {
        zoom: 13,
        center: center,
        scrollwheel: false,
        styles: [
            {
                "featureType": "landscape.man_made",
                "elementType": "geometry",
                "stylers": [
                    {
                        "color": "#f7f1df"
                    }
                ]
            },
            {
                "featureType": "landscape.natural",
                "elementType": "geometry",
                "stylers": [
                    {
                        "color": "#d0e3b4"
                    }
                ]
            },
            {
                "featureType": "landscape.natural.terrain",
                "elementType": "geometry",
                "stylers": [
                    {
                        "visibility": "off"
                    }
                ]
            },
            {
                "featureType": "poi",
                "elementType": "labels",
                "stylers": [
                    {
                        "visibility": "off"
                    }
                ]
            },
            {
                "featureType": "poi.business",
                "elementType": "all",
                "stylers": [
                    {
                        "visibility": "off"
                    }
                ]
            },
            {
                "featureType": "poi.medical",
                "elementType": "geometry",
                "stylers": [
                    {
                        "color": "#fbd3da"
                    }
                ]
            },
            {
                "featureType": "poi.park",
                "elementType": "geometry",
                "stylers": [
                    {
                        "color": "#bde6ab"
                    }
                ]
            },
            {
                "featureType": "road",
                "elementType": "geometry.stroke",
                "stylers": [
                    {
                        "visibility": "off"
                    }
                ]
            },
            {
                "featureType": "road",
                "elementType": "labels",
                "stylers": [
                    {
                        "visibility": "off"
                    }
                ]
            },
            {
                "featureType": "road.highway",
                "elementType": "geometry.fill",
                "stylers": [
                    {
                        "color": "#ffe15f"
                    }
                ]
            },
            {
                "featureType": "road.highway",
                "elementType": "geometry.stroke",
                "stylers": [
                    {
                        "color": "#efd151"
                    }
                ]
            },
            {
                "featureType": "road.arterial",
                "elementType": "geometry.fill",
                "stylers": [
                    {
                        "color": "#ffffff"
                    }
                ]
            },
            {
                "featureType": "road.local",
                "elementType": "geometry.fill",
                "stylers": [
                    {
                        "color": "black"
                    }
                ]
            },
            {
                "featureType": "transit.station.airport",
                "elementType": "geometry.fill",
                "stylers": [
                    {
                        "color": "#cfb2db"
                    }
                ]
            },
            {
                "featureType": "water",
                "elementType": "geometry",
                "stylers": [
                    {
                        "color": "#a2daf2"
                    }
                ]
            }
        ]
    });
    var marker = new google.maps.Marker({
        position: center,
        icon: 'assets/Uploads/marker.png',
        map: map
    });
    bounds = new google.maps.LatLngBounds();
    loc = new google.maps.LatLng(marker.position.lat(), marker.position.lng());
    bounds.extend(loc);
    map.panToBounds(bounds);


}