
(function ($) {

    function getDate(s) {
        // Change this 'Thu Jul 29 11:59:52 +0000 2010' into 'Thu, 29 Jul 2010 11:59:52 GMT-0000'
        //              0   1   2  3        4     5           0    2  1   5    3        4
        s = s.split(' ');
        return new Date(Date.parse(s[0] + ', ' + s[2] + ' ' + s[1] + ' ' + s[5] + ' ' + s[3] + ' GMT' + s[4]));
    }

    var oneHour = 3600 * 1000;
    var oneDay = 24 * oneHour;
    var oneMonth = 30 * oneDay;

    function getDateDiffText(s) {
        var date = getDate(s);
        var diff = new Date().getTime() - date.getTime();
        if (diff < oneHour) {
            return 'less than 1 hour ago';
        } else if (diff < oneDay) {
            var h = Math.ceil(diff / oneHour);
            return h + ' ' + (h > 1 ? 'hours' : 'hour') + ' ago';
        } else if (diff < oneMonth) {
            var d = Math.ceil(diff / oneDay);
            return d + ' ' + (d > 1 ? 'days' : 'day') + ' ago';
        } else {
            var m = Math.ceil(diff / oneMonth);
            return m + ' ' + (m > 1 ? 'months' : 'month') + ' ago';
        }
    }

    function parse(input, container) {
        var parser = /(@\w+|#\w+|http:\/\/[^ ]+)/g, index = 0, m = null;
        while ((m = parser.exec(input)) != null) {
            if (m.index - index > 0)
                container.append($('<span/>').text(input.substring(index, m.index)));
            index = m.index + m[0].length;
            if (m[1].charAt(0) == '@') {
                var substr = m[0].substring(1);
                container.append($('<a/>').addClass('tweet-user').attr('href', 'http://twitter.com/#!/' + substr).text(m[1]));
            } else if (m[1].charAt(0) == '#') {
                var substr = m[0].substring(1);
                container.append($('<a/>').addClass('tweet-hash').attr('href', 'http://twitter.com/#!/search?q=%23' + substr).text(m[1]));
            } else {
                container.append($('<a/>').attr('href', m[0]).text(m[0]));
            }
        }
        if (input.length - index > 0)
            container.append($('<span/>').text(input.substring(index, input.length)));
    }

    window["getTwitterFeed"] = function (twitterUserId, twitterFeedTargetSelector) {

        var url = "http://api.twitter.com/1/statuses/user_timeline.json?screen_name=" + encodeURIComponent(twitterUserId) + "&callback=?";

        $.getJSON(url, function (data) {
            var target = $(twitterFeedTargetSelector);
            target.empty();
            $.each(data, function () {
                var li = $('<li/>');
                parse(this.text, li);
                li.append(document.createTextNode(' '));
                var diffText = getDateDiffText(this.created_at);
                li.append($('<span/>').addClass('tweet-date').text(diffText));
                target.append(li);
            });
        });
    }

})(jQuery);
