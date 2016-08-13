document.addEventListener('DOMContentLoaded', function () {
  // initialization
  var API_KEY = '2b7873498ef5d013f601c53d9dff05f2';
  var extras = '&extras=url_t,url_m,url_o';
  var url = 'https://api.flickr.com/services/rest/?method=flickr.photos.search&format=json&nojsoncallback=1&per_page=100&text=olympics&api_key=' +  API_KEY + extras;
  var apiImages = [];
  var grid = document.querySelector('.grid');
  var request = new XMLHttpRequest();
  var lightboxEnabled = false;
  var lightboxBackdrop = document.querySelector('.lightbox-backdrop');
  var lightboxImage = lightboxBackdrop.querySelector('img');
  var selectedIndex = 0;
  var imageCount = 100;

  request.onreadystatechange = function () {
    if (request.readyState === 4 && request.status === 200) {
      var responseObj = JSON.parse(request.responseText);
      if (responseObj.stat === 'ok') {
        apiImages = responseObj.photos.photo;
        getImageUrls(apiImages);
      } else {
        alert(responseObj.message);
      }
    }
  };

  request.open('GET', url, true);
  request.send();

  // create image templates
  // maybe switch to document fragments??
  var generateImageTile = function (photo, index) {
    return (
      '<div class="image-tile" data-index="' + index + '">' +
      '<img class="hidden" src="' + photo.url_t + '" height="' + photo.height_t + '" width=' + photo.width_t + '" alt="' + photo.title + '">' +
      '</div>'
    );
  };

  var getImageUrls = function (photos) {
      var imageHtml = [];
      photos.forEach(function (photo, index) {
        imageHtml.push(generateImageTile(photo, index));
      });
      grid.innerHTML = imageHtml.join("");
      grid.classList.remove('loading');
  };


  var enableLightbox = function () {
    lightboxBackdrop.classList.add('active');
    lightboxEnabled = true;
  };

  var disableLightBox = function () {
    lightboxBackdrop.classList.remove('active');
    lightboxEnabled = false;
  };

  var selectImage = function (index) {
    var image = apiImages[index];
    lightboxImage.src = image.url_m || image.url_o;
    lightboxImage.alt = image.title.substr(0, 100);
    selectedIndex = index;

    if (!lightboxEnabled) {
      enableLightbox();
    }
  };


  grid.addEventListener('click', function (ev) {
    var target = ev.target;
    var tileNode;

    if (target.matches('img')) {
      tileNode = target.parentNode;
    } else if (target.matches('.image-tile')) {
      tileNode = target;
    } else {
      return;
    }

    var index = parseInt(tileNode.getAttribute('data-index'));
    selectImage(index);
  });

  lightboxBackdrop.querySelector('.prev').addEventListener('click', function () {
    if (selectedIndex === 0) {
      selectImage(imageCount - 1);
    } else {
      selectImage(selectedIndex - 1);
    }
  });

  lightboxBackdrop.querySelector('.next').addEventListener('click', function () {
    if (selectedIndex === imageCount - 1) {
      selectImage(0);
    } else {
      selectImage(selectedIndex + 1);
    }
  });

  lightboxBackdrop.addEventListener('click', function (ev) {
    if (ev.target === this || ev.target.parentNode === this) {
      disableLightBox();
    }
  });

  // delegate image load events during capturing phase
  document.addEventListener('load', function (ev) {
    var imageNode = ev.target;
    imageNode.classList.remove('hidden');
  }, true);
});
