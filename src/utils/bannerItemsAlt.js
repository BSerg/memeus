const sideBanner1 = {
    width: 300, 
    heigth: 600,
    html: `<a style="display: block; width: 100%;" href="https://ad.admitad.com/g/sulzzo59sab2b4a4dce69c697b6d2a/?ulp=https%3A%2F%2Fshop.huawei.ru%2Fhuawei-p10" target="_blank">
        <img style="display: block; width: 100%; height: 100%;" src="https://memeus.ru/media/banners/admitad/banner- 300x600-1.jpg" />
    </a>`
};

const sideBanner2 = {
    width: 300, 
    heigth: 600,
    html: `<a style="display: block; width: 100%;" href="https://ad.admitad.com/g/sulzzo59sab2b4a4dce69c697b6d2a/?ulp=https%3A%2F%2Fshop.huawei.ru%2Fhonor-6c-pro" target="_blank">
        <img style="display: block; width: 100%; height: 100%;" src="https://memeus.ru/media/banners/admitad/banner- 300x600-2.jpg" />
    </a>`
};

const sideBanner3 = {
    width: 300, 
    heigth: 600,
    html: `<a style="display: block; width: 100%;" href="https://ad.admitad.com/g/lxztafolvbb2b4a4dce6e2f27ad8bf/" target="_blank">
        <img style="display: block; width: 100%; height: 100%;" src="https://memeus.ru/media/banners/admitad/banner- 300x600-3.jpg" />
    </a>`
};

const sideBanner4 = {
    width: 300, 
    heigth: 600,
    html: `<a style="display: block; width: 100%;" href="https://ad.admitad.com/g/lxztafolvbb2b4a4dce6e2f27ad8bf/" target="_blank">
        <img style="display: block; width: 100%; height: 100%;" src="https://memeus.ru/media/banners/admitad/banner- 300x600-4.jpg" />
    </a>`
};

const sideBanner5 = {
    width: 300, 
    heigth: 600,
    html: `<a style="display: block; width: 100%;" href="https://ad.admitad.com/g/lxztafolvbb2b4a4dce6e2f27ad8bf/" target="_blank">
        <img style="display: block; width: 100%; height: 100%;" src="https://memeus.ru/media/banners/admitad/banner- 300x600-5.jpg" />
    </a>`
};

const sideBanner6 = {
    width: 300, 
    heigth: 600,
    html: `<a style="display: block; width: 100%;" href="https://ad.admitad.com/g/lxztafolvbb2b4a4dce6e2f27ad8bf/" target="_blank">
        <img style="display: block; width: 100%; height: 100%;" src="https://memeus.ru/media/banners/admitad/banner- 300x600-6.jpg" />
    </a>`
};

const sideBanner7 = {
    width: 300, 
    heigth: 600,
    html: `<a style="display: block; width: 100%;" href="https://ad.admitad.com/g/lxztafolvbb2b4a4dce6e2f27ad8bf/" target="_blank">
        <img style="display: block; width: 100%; height: 100%;" src="https://memeus.ru/media/banners/admitad/banner- 300x600-7.png" />
    </a>`
};

const sideBanner8 = {
    width: 300, 
    heigth: 600,
    html: `<a style="display: block; width: 100%;" href="https://ad.admitad.com/g/sxbmifvx62b2b4a4dce633f5903a11/" target="_blank">
        <img style="display: block; width: 100%; height: 100%;" src="https://memeus.ru/media/banners/admitad/banner- 300x600-8.jpg" />
    </a>`
};

const sideBanner9 = {
    width: 300, 
    heigth: 600,
    html: `<!--BETWEEN SSP CODE V3.0 START--><div id="b_script_2140260"><script>
    if(typeof window.btw_init === "undefined") {window.btw_init = {};}
    window.btw_init[2140260] = function () {
        (function(window, document) {
            function send_log(errors, document, window) {
                if((navigator.userAgent||navigator.vendor||window.opera) == "" || (navigator.userAgent||navigator.vendor||window.opera) == null || (navigator.userAgent||navigator.vendor||window.opera) == undefined) {
                    return false;
                }
    
                var name = "btw_log_sended";
                var matches = document.cookie.match(new RegExp(
                    "(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
                ));
                var cookie = matches ? decodeURIComponent(matches[1]) : undefined;
    
                if(cookie === undefined) {
                    var rand = 1 + Math.random() * (1 + 1 - 1);
                    rand = Math.floor(rand);
    
                    if(rand == 1) {
                        var id      = 0;
                        var mes     = [];
                        var codes   = [];
                        var places  = [];
    
                        var dumps   = [];
                        var count   = 0;
    
    
                        for(var i=0; i<errors.length; i++) {
    
                            if(errors[i].what !== undefined) {
                                id = errors[i].id;
                                mes.push(errors[i].what);
                                codes.push(errors[i].what);
                                places.push(errors[i].where);
                                dumps.push(errors[i].what);
                                continue;
                            } else {
                                if(
                                    errors[i].e.name != 'RangeError' &&
                                    errors[i].e.stack !== undefined &&
                                    errors[i].e.stack !== '' &&
                                    errors[i].e.message !== 'Permission denied' &&
                                    errors[i].where !== '' &&
                                    errors[i].where !== undefined &&
                                    errors[i].name !== '' &&
                                    errors[i].name !== undefined
                                ) {
                                    count++;
                                    id = errors[i].id;
                                    mes.push(errors[i].e.message);
                                    codes.push(errors[i].e.name);
                                    places.push(errors[i].where);
                                    dumps.push(errors[i].e.stack);
                                    continue;
                                }
                            }
                        }
    
                        if(count > 0) {
                            var url = 'id='+id+'&url='+encodeURIComponent(document.location.href)+'&message='+mes.join('<br><br>')+'&code='+codes.join('<br><br>')+'&place='+places.join('<br><br>')+'&agent='+(navigator.userAgent||navigator.vendor||window.opera)+'&dump='+encodeURIComponent(dumps.join('<br><br>'));
    
                            var script = document.createElement('script');
                            script.setAttribute('src', ("https:" === document.location.protocol ? "https://" : "http://") + 'cp.betweendigital.com/log.js?'+url);
                            script.setAttribute('type', 'text/javascript');
                            script.async = true;
    
                            document.body.appendChild(script);
    
                            var date = new Date;
                            date.setDate(date.getDate() + 1);
    
                            document.cookie = name+"=1; path=/; expires=" + date.toUTCString();
                        }
                    }
                }
            }
    
            var errors = [];
            var pixelParams = [
                
                            ['w', '300'],
                ['h', '600'],
                ['tagType', 'adi'],
                ['s', '2140260']
            ]
    
            var adds = {};
            try {
                if(window.__adds_params__ !== undefined && window.__adds_params__[2140260] !== undefined) {
                    adds = window.__adds_params__;
                } else {
                    if(
                        window.subid_2140260 !== undefined ||
                        window.btw_click3rd_2140260 !== undefined ||
                        (window.pubdata !== undefined && window.pubdata[2140260] !== undefined) ||
                        (window.itu !== undefined && window.itu[2140260] !== undefined)
                    ) {
                        adds[2140260] = {}
                    }
    
                    if(window.subid_2140260 !== undefined) {
                        adds[2140260].subid = window.subid_2140260		    	}
                    if(window.btw_click3rd_2140260 !== undefined) {
                        adds[2140260].btw_click3rd = window.btw_click3rd_2140260		    	}
                    if(window.pubdata !== undefined && window.pubdata[2140260] !== undefined) {
                        adds[2140260].pubdata = window.pubdata[2140260]
                    }
                    if(window.itu !== undefined && window.itu[2140260] !== undefined) {
                        adds[2140260].itu = window.itu[2140260]
                    }
                }
            } catch(e) {
                errors.push({id: 2140260, where: 'section.adds', e: e});
                send_log(errors, document, window)
            }
    
            var section = {
                id: 2140260,
                type: 'normal',
                format: 'banner',
                                        c2s: 0,
                fc2s: 0,
                in_visible: 1,
                timeout: undefined,
                show_close: 10,
                adds: adds,
                pixel_params: pixelParams,
                pubdata: window.pubdata,
                icon: 0,
                itu: window.itu,
                source: '//cache.betweendigital.com',
                rotate: 0,
                site_id: 476883,
                
                w: '300',
                h: '600',
                                         
                container: document.getElementById('b_script_2140260') || {},
    
    
                include: function(url, onload) {
                    try {
                        var script = document.createElement('script');
                        script.setAttribute('src', url);
                        script.setAttribute('type', 'text/javascript');
                        script.async = true;
    
                        if (onload !== undefined) {
                            if (script.onreadystatechange !== undefined) {
                                script.onreadystatechange = function () {
                                    if (this.readyState === 'complete' || this.readyState === 'loaded') {
                                        onload();
                                    }
                                };
                            } else {
                                script.onload = onload;
                            }
                        }
    
                        var con = document.getElementById('b_script_2140260');
                        if(con !== null && con !== undefined) {
                            con.appendChild(script);
                        }
                    } catch(e) {
                        errors.push({id: 2140260, where: 'section.include_func', e: e});
                        send_log(errors, document, window)
                        throw e;
                    }
                    return script;
                }
            }
    
    
            var pixel = document.getElementById('tpix_' + section.id);
    
            if (!pixel) {
                try {/*
                    if (window.subid_2140260 !== undefined) {
                        pixelParams.push(['subid', window.subid_2140260]);
                    }
                    if (window.btw_click3rd_2140260 !== undefined) {
                        pixelParams.push(['click3rd', window.btw_click3rd_2140260]);
                    }*/
                    var img = new Image();
                    img.src = '//cache.betweendigital.com/code/1x1.gif';
                    img.setAttribute('style', 'position:absolute;visibility:hidden;width:1px;height:1px;');
                    img.setAttribute('id', 'tpix_' + section.id);
    
                    if(
                        section.container === undefined ||
                        section.container === null ||
                        (typeof section.container.appendChild == 'undefined' || typeof section.container.appendChild == 'null')
                    ) {
                        return false;
                    }
    
                    section.container.appendChild(img);
                    section.pixel = img;
                } catch(e) {
                    errors.push({id: section.id, where: 'section.pixel_check', e: e});
                    send_log(errors, document, window)
                    throw e;
                }
    
            /*if(typeof _bw === 'undefined') {
                section.include(section.source + '/code/_bw.js', function () {
                    load_code();
                });
            } else {*/
                load_code();
            //}
    
            function load_code() {
                section.include(section.source + '/code/async_rtb.js', function () {
                    if (bswad !== undefined && typeof bswad == 'function') {
                        bswad(section);
                    }
                });
            }
            }
    
        })(window, document);
    }
    // Р”РµС‚РµРєС‚ IE9-
    if(document.all && !window.atob) {
        window.onload = function() {
            for(k in window.btw_init) {
                if(window.btw_init.hasOwnProperty(k)) {
                    window.btw_init[k]();
                }
            }
        }
    } else {
        window.btw_init[2140260]();
    }
    
    </script></div><!--BETWEEN SSP END-->`,
}

// export const sideBanners = [sideBanner1, sideBanner2, sideBanner3, sideBanner4, sideBanner5, sideBanner6, sideBanner7, sideBanner8];
export const sideBanners = [sideBanner9];


const contentbanner1 = {
    html: `<a style="display: block; width: 100%;" href="https://ad.admitad.com/g/h1llq5r6q5b2b4a4dce6594123b6a9/?ulp=https%3A%2F%2Fwww.gamiss.com%2Fhoodies-11571%2Fproduct1049716%2F" target="_blank">
        <img style="display: block; width: 100%; height: 100%;" src="https://memeus.ru/media/banners/admitad/banner_600x400_1.png" />
    </a>`

};

const contentbanner2 = {
    html: `<a style="display: block; width: 100%;" href="https://ad.admitad.com/g/h1llq5r6q5b2b4a4dce6594123b6a9/?ulp=https%3A%2F%2Fwww.gamiss.com%2Fhoodies-11585%2Fproduct1181315%2F" target="_blank">
        <img style="display: block; width: 100%; height: 100%;" src="https://memeus.ru/media/banners/admitad/banner_600x400_2.png" />
    </a>`
};

const contentbanner3 = {
    html: `<a style="display: block; width: 100%;" href="https://ad.admitad.com/g/h1llq5r6q5b2b4a4dce6594123b6a9/?ulp=https%3A%2F%2Fwww.gamiss.com%2Fhoodies-11571%2Fproduct949822%2F" target="_blank">
        <img style="display: block; width: 100%; height: 100%;" src="https://memeus.ru/media/banners/admitad/banner_600x400_3.png" />
    </a>`
};

const contentbanner4 = {
    html: `<a style="display: block; width: 100%;" href="https://ad.admitad.com/g/h1llq5r6q5b2b4a4dce6594123b6a9/?ulp=https%3A%2F%2Fwww.gamiss.com%2Fsweatshirts-11572%2Fproduct954758%2F" target="_blank">
        <img style="display: block; width: 100%; height: 100%;" src="https://memeus.ru/media/banners/admitad/banner_600x400_4.png" />
    </a>`
};

const contentbanner5 = {
    html: `<a style="display: block; width: 100%;" href="https://ad.admitad.com/g/h1llq5r6q5b2b4a4dce6594123b6a9/?ulp=https%3A%2F%2Fwww.gamiss.com%2Fcardigans-sweaters-93%2Fproduct391277%2F" target="_blank">
        <img style="display: block; width: 100%; height: 100%;" src="https://memeus.ru/media/banners/admitad/banner_600x400_5.png" />
    </a>`
};




export const contentBanners = [];