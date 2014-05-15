require(['modernizr'], function() {

	var config = {
			addThis: {
				data_track_addressbar: false,
				pubid: '', // Place your AddThis pubid between the quotes or leave empty to disable AddThis sharing
			},
			comments: {
				type: '', // Set to either "Google+", "Disqus" or "Livefyre" to enable commenting
				token: '', // The shortname for Disqus or the site ID for Livefyre. Google+ is very smart and doesn't need anything
			},
			embedly: {
				key: '', // Place your Embedly API key between the quotes or leave empty to disable Embedly embeds
			},
			ga: {
				id: '', // Place your Google Analytics ID between the quotes or leave empty to disable Google Analytics tracking
			},
			tapir: {
				token: '', // Place your Tapir token between the quotes or leave empty to disable search
			},
			featuredImage: true, // Set to false to disable featured images
			history: true, // Set to false to disable HTML5 history + AJAX page loading
			lightbox: true, // Set to false to disable the lightbox
			nextPost: true, // Set to false to disable next post previewing
			readingTime: true, // Set to false to disable reading time
			skrollr: {
				enabled: true, // Set to false if you want to disable Skrollr completely
				mobile: false, // Set to true if you want to enabe Skrollr on mobile devices
			},
		},
		$document = $(document),
		$window = $(window),
		$html = $('html'),
		$body = $(document.body),
		$htmlBody = $body.add($html),
		$sidebar = $('.site-sidebar'),
		$container = $('.site-container'),
		$header = $('.site-header'),
		$main = $('.site-main'),
		click = Modernizr.touch ? 'touchstart' : 'click',
		templates = $.Deferred();


	function loadCss(url) {

		var link = document.createElement('link');

		link.rel = 'stylesheet';
		link.href = url;

		document.getElementsByTagName('head')[0].appendChild(link);
	}

	function isExternal(url) {

		var parser = document.createElement('a');

		parser.href = url;

		return location.host !== parser.host;
	}


	// Google Analytics

	if(config.ga.id && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {

		(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
		(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
		m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
		})(window,document,'script','//www.google-analytics.com/analytics.js','ga');

		ga('create', config.ga.id);
		ga('send', 'pageview');
	}


	// Search

	if(config.tapir.token) {

		require(['handlebars', 'moment', 'jquery.tapirus'], function() {

			templates.done(function($templates) {

				$sidebar.prepend($templates.filter('#search').html());

				$('.site-search-results').Tapirus(config.tapir.token, {
					sessionStorage: Modernizr.sessionstorage,
					templates: {
						count: '',
						result: $templates.filter('#search-result').html(),
					},
				});
			});
		});
	}


	// Sidebar

	if($sidebar.length) {

		var sidebar = {
				hidden: $sidebar.hasClass('hidden'),

				show: function() {

					sidebar.position();

					$body
					.addClass('site-sidebar-visible')
					.removeClass('site-sidebar-hidden');

					$sidebar
					.attr('aria-hidden', sidebar.hidden = false)
					.removeClass('hidden');

					if(Modernizr.csstransitions) $container.on('webkitTransitionEnd transitionend', done);
					else done();

					function done() {

						$html.addClass('overflow-hidden');
					}
				},

				hide: function() {

					$body
					.addClass('site-sidebar-hidden')
					.removeClass('site-sidebar-visible');

					$sidebar
					.attr('aria-hidden', sidebar.hidden = true)
					.addClass('hidden');

					if(Modernizr.csstransitions) $container.on('webkitTransitionEnd transitionend', done);
					else done();

					function done() {

						$html.removeClass('overflow-hidden');
					}
				},

				toggle: function() {

					sidebar[sidebar.hidden ? 'show' : 'hide']();
				},

				position: function() {

					$sidebar.css('top', $window.scrollTop())
				},
			};

		$body
		.on(click, '.site-sidebar-toggle', function(event) {

			event.preventDefault();

			sidebar.toggle();
		})
		.on(click, '.site-sidebar-overlay', sidebar.hide);

		$document.on('keydown', function(event) {

			if(event.keyCode === 27) sidebar.hide();
		});
	}


	// Progressbar

	var progressbar = (function() {

		var $element = $('<div class="progressbar"></div>').appendTo(document.body);

		return {
			destroy: function() {

				$element.remove();
			},

			progress: function(progress) {

				var delay = parseFloat($element.css('transition-duration')) * 1000;

				$element
				.removeClass('hide')
				.width(Math.floor(progress * $body.width()));

				if(progress === 1)
				setTimeout(function() {

					$element.addClass('hide');

					setTimeout(function() {

						$element.width(0);
					},
					delay);
				},
				delay);
			},
		}
	})();


	// History

	if(Modernizr.history && config.history) {

		$body
		.on('click', '.post-excerpt:not(.post-next)', function(event) {

			event.preventDefault();

			history.pushState({pushed: true}, document.title, $(this).find('.post-title a').attr('href'));

			load();
		})
		.on('click', '.post-excerpt.post-next', function(event) {

			event.preventDefault();

			history.pushState(null, document.title, $(this).find('.post-title a').attr('href'));

			load('postnext');
		})
		.on('click', '.pagination a', function(event) {

			event.preventDefault();

			history.pushState(null, document.title, $(this).attr('href'));

			load('pagination' + ($(this).parent().hasClass('older') ? 'next' : 'prev'));
		})
		.on('click', '.site-nav a, .site-search-results a', function(event) {

			if(isExternal(this.href)) return;

			event.preventDefault();

			history.pushState(null, document.title, $(this).attr('href'));

			load()
			.done(function() {

				sidebar.position();

				setTimeout(function() {

					sidebar.hide();
				},
				200);
			});
		});

		window.addEventListener('popstate', function(event) {

			load(null, true);
		});


		function load(type, popstate) {

			var url = location.href,
				deferred = $.Deferred();

			if(config.ga.id && typeof ga === 'function') ga('send', 'pageview', {'page': location.pathname, 'title': document.title});

			if(!popstate) progressbar.progress(0.5);

			switch(type) {

				case 'paginationnext':

					$.ajax(url)
					.done(function(data) {

						var $dummy = $('<div></div>').html(data),
							$newContainer = $dummy.find('.site-container');

						$body.append($newContainer)

						$htmlBody
						.animate({scrollTop: $newContainer.offset().top}, 500)
						.promise()
						.done(function() {

							$container.remove();

							$container = $newContainer;

							$window.scrollTop(0); // Reset scroll position after removing main

							init();

							deferred.resolve();

							progressbar.progress(1);
						});

						beforeInit();
					});

					break;

				case 'paginationprev':

					$.ajax(url)
					.done(function(data) {

						var $dummy = $('<div></div>').html(data),
							$newContainer = $dummy.find('.site-container');

						$sidebar.after($newContainer);

						$htmlBody
						.scrollTop($container.offset().top)
						.animate({scrollTop: 0}, 1000)
						.promise()
						.done(function() {

							$container.remove();

							$container = $newContainer;

							init();

							deferred.resolve();

							progressbar.progress(1);
						});

						beforeInit();
					});

					break;

				case 'postnext':

					var $postNext = $('.post-next'),
						url = $postNext.find('.post-title a').attr('href');

					$.ajax(url)
					.done(function(data) {

						var $dummy = $('<div></div>').html(data);

						document.title = $dummy.find('title').html();

						$postFull = $dummy.find('.post-full');

						$postNext.replaceWith($postFull.addClass('loading'));

						$htmlBody
						.animate({scrollTop: $postFull.offset().top}, 600)
						.promise()
						.done(function() {

							$('.post-full').first().remove();

							setTimeout(function() {

								$postFull.removeClass('loading');

							});

							$window.scrollTop(0);

							progressbar.progress(1);

							init();
						});
					});

					break;

				default:

					$.ajax(url)
					.done(function(data) {

						var $dummy = $('<div></div>').html(data),
							$newContainer = $dummy.find('.site-container');

						document.title = $dummy.find('title').html();

						$container.remove();

						$container = $newContainer;

						$body.append($newContainer);

						$window.scrollTop(0);

						init();

						deferred.resolve();

						if(!popstate) progressbar.progress(1);
					});
			}

			return deferred;
		}
	}
	else {

		$body.on('click', '.post-excerpt a', function(event) {

			event.preventDefault();

			location.href = this.href;
		});
	}


	// Skrollr

	if(config.skrollr.enabled === true && (config.skrollr.mobile === true || !(/Android|iPhone|iPad|iPod|BlackBerry|Windows Phone/i).test(navigator.userAgent || navigator.vendor || window.opera))) {

		require(['skrollr'], function() {

			window.Skrollr = skrollr.init({
				forceHeight: false, 
			});
		});
	}


	// SS Social

	require(['ss-social']);


	// Init

	function beforeInit() {

		// Skrollr

		if(window.Skrollr) Skrollr.refresh();
	}

	function init() {

		var $postFull = $('.post-full');


		// Templates

		templates = $.Deferred();

		if(Modernizr.sessionstorage && sessionStorage.getItem('templates')) {

			templates.resolve($('<div></div>').html(sessionStorage.getItem('templates')).find('template'));
		}
		else {

			$.ajax('/assets/templates.html')
			.done(function(data) {

				templates.resolve($('<div></div>').html(data).find('template'));

				if(Modernizr.sessionstorage) sessionStorage.setItem('templates', data);
			});
		}


		// Sidebar

		if($sidebar.length) $container.append('<div class="site-sidebar-overlay"></div>');


		// Skrollr

		if(window.Skrollr) Skrollr.refresh();


		// Prism

		if($('pre code').length) {

			loadCss('/assets/css/prism.css');

			require(['prism'], function() {

				Prism.highlightAll();
			});
		}


		// Sharing

		if(config.addThis.pubid && $postFull.length) {

			templates.done(function($templates) {

				$postFull.find('.post-footer .published').append($templates.filter('#share').html());

				window.addthis_config = config.addThis;

				require(['//s7.addthis.com/js/300/addthis_widget.js#pubid=' + config.addThis.pubid], function() {

					// http://www.addthis.com/blog/2013/05/07/a-brief-history-of-using-addthis-dynamically
					addthis.toolbox('.addthis_toolbox');
				});
			});
		}


		// Comments

		if(config.comments.type && $postFull.length && !$body.hasClass('page')) {

			templates.done(function($templates) {

				$postFull.find('.wrapper').append($templates.filter('#comments').html());

				$('.comments-toggle').on('click', function(event) {

					event.preventDefault();

					var element = this;

					$(this).hide();

					require(['comments'], function(Comments) {

						Comments(element, config.comments.type, config.comments.token);
					});
				});
			});
		}


		// Reading time

		if(config.readingTime) {

			function readingTime(text) {

				var totalWords = text.split(' ').length,
					wordsPerMinute = 270;

				return Math.max(Math.round(totalWords / wordsPerMinute), 1);
			}

			$postFull.prepend('<div class="post-reading-time">' + readingTime($postFull.find('.post-content').text()) + ' min read</div>');
		}


		// Featured image

		if(config.featuredImage) {

			var $featuredImage = $('.post-full .post-content p:first-child img');

			if($featuredImage.length) {

				$('<div class="featured-image"></div>')
				.css('background-image', 'url(' + $featuredImage.attr('src') + ')')
				.prependTo($postFull);
			}
		}


		// Lightbox

		if(config.lightbox) {

			$postFull
			.find('.post-content img')
			.addClass('lightbox');

			$overlay = $('<div class="lightbox-overlay hidden"></div>').appendTo($body);

			$postFull.on(click, '.lightbox', function(event) {

				event.preventDefault();

				$overlay
				.removeClass('hidden')
				.css('background-image', 'url(' + $(this).attr('src') + ')');

				$window.one('scroll.lightbox', function() {

					$overlay.addClass('hidden');
				});
			});

			$overlay.on(click, function() {

				$overlay.addClass('hidden');

				$window.off('scroll.lightbox');
			});
		}


		// Embedly & FitVids

		if(config.embedly.key) {

			require(['jquery.embedly'], function() {

				// http://embed.ly/docs/tutorials/responsive
				$postFull
				.find('.post-content p a:only-child')
				.embedly({
					key: config.embedly.key,
					display: function(obj) {

						// Overwrite the default display.
						if(obj.type === 'video' || obj.type === 'rich') {

							// Figure out the percent ratio for the padding. This is (height/width) * 100
							var ratio = ((obj.height/obj.width)*100).toPrecision(4) + '%'

							// Wrap the embed in a responsive object div. See the CSS here!
							var div = $('<div class="responsive-object">').css({
								paddingBottom: ratio
							});

							// Add the embed to the div.
							div.html(obj.html);

							// Replace the element with the div.
							$(this).replaceWith(div);
						}
					}
				});
			});
		}
		else {

			require(['jquery.fitvids'], function() {

				$('.post-content').fitVids();
			});
		}


		// Next post

		if(config.nextPost && $postFull.length) {

			require(['modernizr', 'handlebars', 'jquery.ghostnextpost'], function() {

				templates.done(function($templates) {

					$postFull.GhostNextPost($templates.filter('#post-next').html());
				});
			});
		}
	}

	init();
});