/* policy-date.js
 * Sets the #date element to a UK ordinal date string, e.g. "13th April 2026".
 * Runs before deferred main.js so main.js (which only writes if empty) leaves
 * the value untouched.
 */
(function () {
    function ordinal(n) { var s = ['th', 'st', 'nd', 'rd'], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); }
    var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    var el = document.getElementById('date');
    if (el) { var d = new Date(); el.textContent = ordinal(d.getDate()) + ' ' + months[d.getMonth()] + ' ' + d.getFullYear(); }
}());
