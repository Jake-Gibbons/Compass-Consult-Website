
        (function () {
            var map = document.getElementById('location-map');
            if (map) {
                map.addEventListener('load', function () {
                    if (map.src !== 'about:blank') {
                        var placeholder = document.getElementById('map-placeholder');
                        if (placeholder) placeholder.style.display = 'none';
                    }
                });
            }
        }());
    