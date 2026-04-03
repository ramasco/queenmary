
/**
* BLPopUp.js
* file javascript
* @copyright 2010 - 2015 BookingLive Software Limited
*/(function($) {
    $('head').append('<link rel="stylesheet" href="mysite/css/BLPopUp.css" type="text/css" />');
    $.fn.extend({

        BLPopUp: function(opts) {
            var loadedButtons = new Array();
            var bIframeDisable = false;
            if (typeof opts.buttons =='undefined') {
                opts.buttons = new Object();
            }

            if (typeof opts.height == "undefined") {
                var windowHeight = $(window).height();
                opts.height = windowHeight / 3;
            }

            if (typeof opts.size != "undefined") {
                if (opts.size=='Small') {
                    opts.width = 400;
                } else if (opts.size=='Medium') {
                    opts.width = 600;
                } else if (opts.size=='Large') {
                    opts.width = 800;
                    opts.height = windowHeight - 100;
                } else if (opts.size=='XLarge') {
                    opts.width = 980;
                    opts.height = windowHeight - 100;
                }
            }
            if (typeof opts.IframeDisable != "undefined") {
                if (opts.IframeDisable) {
                    bIframeDisable = true;
                }
            }

            //console.log(opts.height);

            var obj = $(this);
            if (!bIframeDisable) {
                if (typeof opts.iFrameID !='undefined') {
                    var iFrameTag = 'Iframe#'+opts.iFrameID;

                    $(iFrameTag).load(function() {
                    $.each(loadedButtons, function(index, result) {
                        delete opts.buttons[result];
                    });
                    $(iFrameTag).each(function() {

                        var form = $('form',this.contentWindow.document||this.contentDocument);
                        $('.Actions input', this.contentWindow.document||this.contentDocument).each(function(){
                            var actionName = $(this).attr('name');
                            var actionValue = $(this).val();

                            loadedButtons.push($(this).val());

                            opts.buttons[$(this).val()] = function() {
                                $(".manualyAdded").remove();
                                form.append(
                                    $('<input/>',{'class':'manualyAdded'})
                                        .attr('type', 'hidden')
                                        .attr('name', actionName)
                                        .val(actionValue)
                                );
                                form.submit();
                            };
                        })
                        $('.Actions input', this.contentWindow.document||this.contentDocument).hide();
                    });

                    var ReOrderButtons = new Object();

                    $.each(loadedButtons, function(index, result) {
                        ReOrderButtons[result] = opts.buttons[result];
                    });

                    for (var k in opts.buttons) {
                        ReOrderButtons[k] = opts.buttons[k];
                    }

                    opts.buttons = new Object();
                    opts.buttons = ReOrderButtons;

                    obj.dialog(opts);

                    $("button span").each(function(){
                        if ($(this).text()==''){
                            $(this).parent().hide();
                        }
                    })
                })
            }
                var pageForm = $(this).parents('form');

                $('Iframe .Actions input').each(function(){
                    loadedButtons.push($(this).val());
                    opts.buttons[$(this).val()] = function() {
                        $(".manualyAdded").remove();
                        pageForm.append(
                            $('<input/>',{'class':'manualyAdded'})
                                .attr('type', 'hidden')
                                .attr('name', actionName)
                                .val(actionValue)
                        );
                        pageForm.submit();
                    };
                })
                pageForm.find('.Actions input').hide();
            }

			opts.dialogClass = "bl_popup";
			
			if(typeof opts.reloadPanelOnClose != "undefined" && opts.reloadPanelOnClose) {
			    opts['preClose'] = function() {};
                if(typeof opts.close != "undefined")
                     opts['preClose'] = opts.close;
    			opts['close'] = function( event, ui ) {
    			    if(typeof opts.preClose != "undefined")
    			         opts.preClose(event, ui);
    			    
                    $.entwine('ss', function($){
                        $('.cms-container').reloadCurrentPanel();
                    });
    			};
            }

            $(this).dialog(opts);
            
            

            // appendTo only supported in jQuery ui 1.10.0+ (ss = v1.9.2 - 2012-11-23) so we need to fake it
            if (opts.appendTo) {
                $(this).parents('.ui-dialog').appendTo($(opts.appendTo));
                $(this).dialog("option", "position", "center");
            }
        }

    });
}(jQuery));
