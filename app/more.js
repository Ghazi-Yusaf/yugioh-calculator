'use strict';

var ycMakeMore = function (spec) {
  spec = spec === undefined ? {} : spec;
  var more = {};
  more.view = function () {
    return [
      m('.yc-more-row', [
        m('.yc-more-col', 'History'),
        m('.yc-more-col', 'Notes')
      ]),
      m('.yc-more-row', [
        m('.yc-more-col', 'Dice'),
        m('.yc-more-col', 'Coin')
      ]),
      m('.yc-more-row', [
        m('.yc-more-col', 'Counter'),
        m('.yc-more-col', 'Calc')
      ]),
      m('.yc-more-row', [
        m('.yc-more-col', 'Ruling'),
        m('.yc-more-col', 'Banlist')
      ]),
      m('.yc-more-row', [
        m('.yc-more-col', 'Donate'),
        m('.yc-more-col', 'Setting')
      ])
    ];
  };
  return more;
};
