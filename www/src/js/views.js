// eslint-disable-next-line
import App from './classes/app.class';
import REST from './classes/REST.class';
import getOrders from './ui/admin-orders';
import geoEvent from './classes/geo-locate.js';
import Extra from './classes/extra.class';
import Piggy from './classes/piggy.class';
import previewOrder from './ui/previeworder';
import User from './classes/user.class';

/**
 * Setup for SPA views
 *
 * @export
 * @param {App} app
 */
export default function viewsSetup (app) {
  app.bindView('our-products.html', '/info', null, async () => {
    $('#express')
      .parent()
      .first()
      .hover(
        function () {
          $(this)
            .children()
            .first()
            .prop('src', '/images/express-piggy-zoom.jpg');
          $(this).addClass('thumbnail-photo-hover');
        },
        function () {
          setTimeout(() => {
            $(this)
              .children()
              .first()
              .prop('src', '/images/express-piggy.jpg');
          }, 200);
          $(this).removeClass('thumbnail-photo-hover');
        }
      );

    $('#turbo')
      .parent()
      .first()
      .hover(
        function () {
          $(this)
            .children()
            .first()
            .prop('src', '/images/turbo-piggy-zoom.jpg');
          $(this).addClass('thumbnail-photo-hover');
        },
        function () {
          setTimeout(() => {
            $(this)
              .children()
              .first()
              .prop('src', '/images/turbo-piggy.jpg');
          }, 200);
          $(this).removeClass('thumbnail-photo-hover');
        }
      );

    $('#spider')
      .parent()
      .first()
      .hover(
        function () {
          $(this).addClass('thumbnail-photo-hover');
        },
        function () {
          $(this).removeClass('thumbnail-photo-hover');
        }
      );
  });

  app.bindView('kundservice.html', '/kundservice', null, async () => {});

  app.bindView('mapview.html', '/mapview', null, async () => {
    window.position = async (timeString, positions) => {
      let time = new Date(timeString);
      let timeDiff = Infinity; // Math.abs(time - this.positions[0].time);
      let currPos = {};

      for (let position of positions) {
        let positionTime = new Date(position.time);
        let currDiff = Math.abs(time - positionTime);
        if (currDiff <= timeDiff) {
          timeDiff = currDiff;
          currPos = position;
        }
      }
      return currPos;
    };

    window.initMap = async (theTime = new Date()) => {
      // console.log('Bom right man');
      let hq = {
        lat: 55.6108096,
        lng: 12.9946562
      };

      // get all the cars with position(time) and get the lang/lat and save to array
      let center = {
        lat: 55.589423,
        lng: 13.021704
      };

      let map = new google.maps.Map(document.getElementById('map'), {
        zoom: 13,
        center: center
      });

      let response = await REST.request('waypoints', 'GET', '');
      let waypoints = response.result;

      for (let waypoint of waypoints) {
        let poss = await position(theTime, waypoint.positions);
        let marker = new google.maps.Marker({
          position: {
            lat: poss.lat,
            lng: poss.lng
          },
          map: map,
          title: 'PIGGY GONE WILD'
        });
      }

      // let marker = new google.maps.Marker({
      //   position: hq,
      //   map: map,
      //   title: 'HQ'
      // });
    };
  });

  app.bindView('admin_orders.html', '/admin', null, () => {
    getOrders();

    window.position = async (timeString, positions) => {
      let time = new Date(timeString);
      let timeDiff = Infinity; // Math.abs(time - this.positions[0].time);
      let currPos = {};

      for (let position of positions) {
        let positionTime = new Date(position.time);
        let currDiff = Math.abs(time - positionTime);
        if (currDiff <= timeDiff) {
          timeDiff = currDiff;
          currPos = position;
        }
      }
      return currPos;
    };

    window.initMap = async (theTime = new Date()) => {
      // console.log('Bom right man');
      let hq = {
        lat: 55.6108096,
        lng: 12.9946562
      };

      // get all the cars with position(time) and get the lang/lat and save to array
      let center = {
        lat: 55.589423,
        lng: 13.021704
      };

      let map = new google.maps.Map(document.getElementById('map'), {
        zoom: 13,
        center: center
      });

      let response = await REST.request('waypoints', 'GET', '');
      let waypoints = response.result;

      for (let waypoint of waypoints) {
        let poss = await position(theTime, waypoint.positions);
        let marker = new google.maps.Marker({
          position: {
            lat: poss.lat,
            lng: poss.lng
          },
          map: map,
          title: 'PIGGY GONE WILD'
        });
      }

      // let marker = new google.maps.Marker({
      //   position: hq,
      //   map: map,
      //   title: 'HQ'
      // });
    };
  });

  /*
  * views/home.html = /
  */
  app.bindView(
    'home.html',
    '/',
    async () => {
      let extras = await Extra.find('');
      let piggyTypes = (await Piggy.find(''))
        .reduce((acc, piggy) => {
          if (!acc.includes(piggy.type)) {
            acc.push(piggy.type);
          }
          return acc;
        }, [])
        .map((piggyType) => {
          return {
            type: piggyType,
            id: piggyType.replace(' ', '').toLowerCase()
          };
        });
      let result = {
        snacks: extras.filter((item) => item.types.length > 0),
        packs: extras.filter((item) => item.types.length === 0),
        piggies: piggyTypes
      };
      // result.packs[0].description = 'camping.jpg';
      result.packs[0].image = result.packs[0].name.toLowerCase() + '.jpg';
      // result.packs[1].description = 'camping.jpg';
      result.packs[1].image = result.packs[1].name.toLowerCase() + '.jpg';
      // result.packs[2].description = 'camping.jpg';
      result.packs[2].image = result.packs[2].name.toLowerCase() + '.jpg';
      // result.packs[3].description = 'camping.jpg';
      result.packs[3].image = result.packs[3].name.toLowerCase() + '.jpg';
      return result;
    },
    () => {
      require('./ui/find-piggy');
      geoEvent();
      let today = new Date();
      today = new Date(today.setMinutes(today.getMinutes() - 1));
      $('#departure-time').datetimepicker({
        locale: 'sv',
        icons: {
          time: 'far fa-clock'
        },
        minDate: today,
        defaultDate: new Date()
      });
      $('#departure-time').on('hide.datetimepicker', function () {
        // $.scrollTo('#extras', 1500, 'easeInOutCubic');
      });
      $('#finish').click(async function () {
        let user = await User.findOne();
        if (user) {
          $('#payment').show();
          $.scrollTo('#payment');
          previewOrder();
        } else {
          $('#login').trigger('click');
        }
      });
    }
  );
}
