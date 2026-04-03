$("a[href*='#']").on('click', function(e) {
    href = $(this).attr('href');
    arrHref = href.split('#');
    if (arrHref.length == 2) {
        e.preventDefault();
        scrollToAnchor(arrHref[1]);
    }
});

function scrollToAnchor(aid){
    var aTag = $("a[name='"+ aid +"']");
    if (aTag.length > 0) {
        offset = aTag.offset().top;
        if (aid == 'top') {
            offset = 0;
        }

        $('html,body').animate({scrollTop: offset}, 'slow');
    }
}