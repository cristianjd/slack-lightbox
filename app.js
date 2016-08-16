document.addEventListener('DOMContentLoaded', function () {
  var App = function (configs) {
    // API Options
    var options = configs || {};
    this.baseUrl = options.baseUrl;
    this.apiKey = options.apiKey;
    this.searchQuery = options.searchQuery;
    this.imageCount = options.imageCount;

    // DOM Nodes
    this.contentNode = document.querySelector('.content');
    this.gridNode = this.contentNode.querySelector('.grid');
    this.lightboxNode = document.querySelector('.lightbox');
    this.lightboxImageNode = this.lightboxNode.querySelector('.lightbox-image');

    // Initialize Application State
    this.selectedIndex = 0;
    this.lightboxEnabled = false;
    this.apiImages = [];
  };

  App.prototype.toggleLightbox = function () {
    this.lightboxEnabled = !this.lightboxEnabled;
    this.lightboxNode.classList.toggle('active');
    if (!this.lightboxEnabled) {
      // remove source to prevent flickering on IE
      this.lightboxImageNode.src = '';
    }
  };

  App.prototype.trimAltText = function (title) {
    return title.substr(0, 100);
  };

  App.prototype.selectLightboxImage = function (index) {
    var image = this.apiImages[index];
    // in rare case that medium image is unavailable, default to original size
    this.lightboxImageNode.src = image.url_m || image.url_o;
    this.lightboxImageNode.alt = this.trimAltText(image.title);
    this.selectedIndex = index;

    if (!this.lightboxEnabled) {
      this.toggleLightbox();
    }
  };

  App.prototype.showError = function (errorMessage) {
    this.contentNode.classList.add('error');
    console.log('Error: ' + errorMessage);
  };

  App.prototype.generateImageTileTemplate = function (image, index) {
    // Returns template for tiles with thumbnail size images
    return (
      '<div class="tile" data-index="' + index + '">' +
        '<img class="tile-image hidden" src="' + image.url_t + '" height="' + image.height_t + '" width=' + image.width_t + '" alt="' + this.trimAltText(image.title) + '">' +
      '</div>'
    );
  };

  App.prototype.processImages = function (images) {
    // Append image tiles to DOM
    var imageHtml = [];
    images.forEach(function (image, index) {
      imageHtml.push(this.generateImageTileTemplate(image, index));
    }.bind(this));
    this.apiImages = images;
    this.gridNode.innerHTML = imageHtml.join("");
    this.contentNode.classList.remove('loading');
  };

  App.prototype.handleDOMEvents = function () {
    // Fade in images as they are loaded
    // Use capturing phase to delegate
    this.gridNode.addEventListener('load', function (ev) {
      var imageNode = ev.target;
      if (imageNode.classList.contains('hidden')) {
        imageNode.classList.remove('hidden');
      }
    }, true);

    // Open Lightbox With Clicked Image Selected
    this.gridNode.addEventListener('click', function (ev) {
      var target = ev.target;
      var tileNode;

      if (target.classList.contains('tile-image')) {
        tileNode = target.parentNode;
      } else if (target.classList.contains('tile')) {
        tileNode = target;
      } else {
        return;
      }

      var index = parseInt(tileNode.getAttribute('data-index'));
      this.selectLightboxImage(index);
    }.bind(this));

    this.lightboxNode.addEventListener('click', function (ev) {
      var target = ev.target;
      var currentTarget = ev.currentTarget;
      if (target === currentTarget || target.parentNode === currentTarget) {
        // Close lightbox when clicking on it
        this.toggleLightbox();
      } else if (target.classList.contains('lightbox-prev')) {
        // Go to previous image or loop to the end
        if (this.selectedIndex === 0) {
          this.selectLightboxImage(this.imageCount - 1);
        } else {
          this.selectLightboxImage(this.selectedIndex - 1);
        }
      } else if (target.classList.contains('lightbox-next')) {
        // Go to next image or loop to the beginning
        if (this.selectedIndex === this.imageCount - 1) {
          this.selectLightboxImage(0);
        } else {
          this.selectLightboxImage(this.selectedIndex + 1);
        }
      }
    }.bind(this));
  };

  App.prototype.requestImages = function (success, error) {
    var request = new XMLHttpRequest();
    // Contruct API URL from options
    var url = this.baseUrl + '&text=' + this.searchQuery + '&per_page=' + this.imageCount + '&api_key=' + this.apiKey;

    request.addEventListener("readystatechange", function () {
      if (request.readyState === 4) {
        if (request.status === 200) {
          var response;
          try {
            response = JSON.parse(request.responseText);
          } catch (err) {
            error.call(this, err.toString());
            return;
          }
          if (response.stat === 'ok') {
            success.call(this, response.photos.photo);
          } else {
            error.call(this, response.message);
          }
        } else {
          error.call(this, 'API Error');
        }
      }
    }.bind(this));

    request.open('GET', url, true);
    request.send();
  };

  App.prototype.init = function () {
    this.handleDOMEvents();
    this.requestImages(this.processImages, this.showError);
  };

  // Start App
  var configs = {
    apiKey: '2b7873498ef5d013f601c53d9dff05f2',
    baseUrl: 'https://api.flickr.com/services/rest/?method=flickr.photos.search&format=json&nojsoncallback=1&extras=url_t,url_m,url_o',
    imageCount: 150,
    searchQuery: 'olympics'
  };
  var app = new App(configs);
  app.init();
});
