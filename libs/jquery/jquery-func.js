function mycarousel_initCallback(carousel) {
	$('.slider-navigation a').bind('click', function() {
		carousel.scroll($.jcarousel.intval($(".hidden-id:eq(0)", this).text()));
		return false;
	});
	carousel.clip.hover(function() {
		carousel.stopAuto();
	}, function() {
		carousel.startAuto();
	});
};
	
function mycarousel_itemFirstInCallback(carousel, item, idx, state) {
	$('.slider-navigation a').removeClass('active');
	$('.slider-navigation a').eq(idx-1).addClass('active');
};


$(document).ready (function(){
	
	$(".slider-carousel").jcarousel({
		scroll:1,
		auto: 5,
		wrap:"both",
		visible:1,
        itemFirstInCallback: mycarousel_itemFirstInCallback,
        initCallback: mycarousel_initCallback,
        start: 1
		
	});
	
});

