Helpers.ready(function(){
	var initialHashTarget = Helpers.hashTarget(window.location.hash);
	if (initialHashTarget) {
		// The browser keeps re-scrolling to the fragment while the page loads, so apply the header offset afterwards
		var scrollToInitialHash = function () {
			setTimeout(function () { Helpers.scrollToTarget(initialHashTarget); }, 0);
		};
		if (document.readyState === 'complete') {
			scrollToInitialHash();
		} else {
			window.addEventListener('load', scrollToInitialHash, { once: true });
		}
		var hashParent = initialHashTarget.parentElement;
		if (document.body.classList.contains('faq') && hashParent && hashParent.classList.contains('qa-wrap')) {
			hashParent.classList.add('open');
			hashParent.querySelectorAll('.answer').forEach(function (answer) {
				Helpers.slideDown(answer, 150);
			});
		}
	}
	
	
	
	/** DARK MODE SWITCH */
	var isDark = document.documentElement.classList.contains('darkmode');
	var modeButtons = document.querySelectorAll('.mode');
	modeButtons.forEach(function (button) {
		button.setAttribute('data-mode', isDark ? 'light' : 'dark');
	});

	setTimeout(() => {
		document.documentElement.classList.remove('disable-transitions');
	}, 300);
	
	modeButtons.forEach(function (button) {
		button.addEventListener('click', onModeClick);
	});

	function onModeClick() {
		var isDark = this.getAttribute('data-mode') === 'dark';
		document.documentElement.classList.toggle('darkmode', isDark);
		this.setAttribute('data-mode', isDark ? 'light' : 'dark');
		localStorage.setItem('mode', isDark ? 'dark' : 'light');
		if (isDark) {
			document.documentElement.style.backgroundColor = '#0d0d0d';
			document.documentElement.style.colorScheme = 'dark';
		} else {
			document.documentElement.style.backgroundColor = '';
			document.documentElement.style.colorScheme = '';
		}
		document.documentElement.classList.add('disable-transitions');
		setTimeout(() => {
			document.documentElement.classList.remove('disable-transitions');
		}, 300);
	}


	// Same Page Anchor Scroll Navigation
	document.querySelectorAll('a[href*="#"]:not([href="#"]):not([href="#0"])').forEach(function (link) {
		link.addEventListener('click', function (event) {
			if (event.target.closest('svg.anchor-icon')) {
				return;
			}
			if (
				location.pathname.replace(/^\//, '') !== this.pathname.replace(/^\//, '') ||
				location.hostname !== this.hostname ||
				location.search !== this.search
			) {
				return;
			}
			var target = Helpers.hashTarget(this.hash);
			if (!target) {
				return;
			}
			event.preventDefault();
			if (location.hash !== this.hash) {
				history.pushState(null, '', this.hash);
			}
			Helpers.scrollToTarget(target);
		});
	});


	// Preselect the membership level from the URL hash on the contact page
	if (document.body.classList.contains('foundation') && document.querySelector('section.form')) {
		var membershipHash = window.location.hash.replace('#', '');
		if (membershipHash.length) {
			document.querySelectorAll('.custom-select .select-text').forEach(function (select) {
				select.value = membershipHash;
			});
		}
	}

	// Contact Form AJAX
	var ajaxForm = document.getElementById('ajaxForm');
	if (ajaxForm) {
		var submitButtons = function () { return ajaxForm.querySelectorAll('button[type="submit"]'); };
		var loaders = function () { return ajaxForm.querySelectorAll('.lds-ellipsis'); };

		var resetSubmit = function () {
			submitButtons().forEach(function (button) { Helpers.show(button); });
			loaders().forEach(function (loader) { Helpers.stop(loader); Helpers.hide(loader); });
		};

		var alertErrors = function (data) {
			if (data && data.errors) {
				var errorText = data.errors.map(error => error.message).join(", ");
				alert('Error: ' + errorText);
			} else {
				alert('An error occurred! Please try again later.');
			}
		};

		ajaxForm.addEventListener('submit', function (e) {
			e.preventDefault();
			var form = this;
			var action = form.getAttribute('action');

			submitButtons().forEach(function (button) { Helpers.hide(button); });
			loaders().forEach(function (loader) { Helpers.fadeIn(loader); });

			fetch(action, {
				method: 'POST',
				body: new FormData(form),
				headers: {
					'Accept': 'application/json'
				}
			}).then(function (response) {
				return response.text().then(function (text) {
					var data = null;
					try { data = JSON.parse(text); } catch (err) {}
					return { ok: response.ok && data !== null, data: data };
				});
			}).then(function (result) {
				if (result.ok && result.data.ok) {
					form.classList.add('inactive');
					loaders().forEach(function (loader) { Helpers.stop(loader); Helpers.hide(loader); });
					document.querySelectorAll('.success').forEach(function (el) { el.classList.add('is-active'); });
					form.reset();
				} else {
					alertErrors(result.data);
					resetSubmit();
				}
			}).catch(function () {
				alertErrors(null);
				resetSubmit();
			});
		});
	}

// Add class-name to external Links
function linksWithIcon(classes) {
	return Array.from(document.querySelectorAll(['#main_content_wrap', '.singleentry .content'].map(function (scope) {
		return classes.map(function (cls) { return scope + ' a.' + cls; }).join(', ');
	}).join(', ')));
}

function markLinks(test, addClass, removeClasses, exclude, githubTables, supporterBoard, onMatch) {
	document.querySelectorAll('a').forEach(function (a) {
		if (test(a)) {
			a.classList.add(addClass);
			removeClasses.forEach(function (cls) { a.classList.remove(cls); });
			if (onMatch) onMatch(a);
		}
	});
	document.querySelectorAll(exclude).forEach(function (a) { a.classList.remove(addClass); });
	if (githubTables) {
		document.querySelectorAll('table a.' + addClass).forEach(function (a) {
			if (a.textContent.includes('GitHub')) {
				a.classList.remove(addClass);
				a.classList.add('nobg');
			}
		});
	}
	if (supporterBoard) {
		document.querySelectorAll('.supporterboard a.' + addClass).forEach(function (a) {
			a.classList.remove(addClass);
			a.classList.add('nobg');
		});
	}
}

function hrefMatches(a, pattern) {
	var href = a.getAttribute('href');
	return Boolean(href) && pattern.test(href) && !a.querySelector('img') && !a.classList.contains('button');
}

markLinks(function (a) {
	return a.hostname && a.hostname !== location.hostname && !a.querySelector('img, svg') && !a.classList.contains('button');
}, 'externallink', [], '.headercontent a, .box-link a, .footercontent a, .highlight a, .button, .download-btn, .ecosystem-diagram a, a.tag, a:has(> .tag)', true, true, function (a) {
	a.setAttribute('target', '_blank');
});

// Add download icon to links pointing to downloadable files
markLinks(function (a) {
	return hrefMatches(a, /\.(pdf|zip|gz|tar|jar|csv|parquet|mp3)(\?.*)?$/i);
}, 'downloadlink', ['externallink'], '.headercontent a, .box-link a, .footercontent a, .highlight a, .button, .download-btn, .ecosystem-diagram a', true, true);

// Add play icon to links pointing to YouTube or Vimeo
markLinks(function (a) {
	return hrefMatches(a, /^(https?:)?\/\/(www\.|m\.)?(youtube\.com|youtu\.be|vimeo\.com)\//i);
}, 'videolink', ['externallink', 'downloadlink'], '.headercontent a, .box-link a, .footercontent a, .highlight a, .button, .ecosystem-diagram a', true, true);

// Add podcast icon to links pointing to Spotify or Apple Podcasts
markLinks(function (a) {
	return hrefMatches(a, /^(https?:)?\/\/(open\.spotify\.com|podcasts\.apple\.com)\//i);
}, 'podcastlink', ['externallink', 'downloadlink', 'videolink'], '.headercontent a, .box-link a, .footercontent a, .highlight a, .button, .ecosystem-diagram a', false, true);

// Glue the anchor icon to the last word of a heading so it never wraps alone
document.querySelectorAll(':is(h1, h2, h3, h4, h5, h6) svg.anchor-icon').forEach(function (svg) {
	var a = svg.parentElement;
	if (!a || a.tagName !== 'A' || a.querySelector('.anchor-wrap')) return;
	var contents = Array.from(a.childNodes);
	var last = null;
	for (var i = contents.length - 1; i >= 0; i--) {
		if (contents[i] === svg) continue;
		last = contents[i];
		break;
	}
	if (!last || last.nodeType !== 3) return;
	var match = last.nodeValue.match(/(\S+)(\s*)$/);
	if (!match) return;
	last.nodeValue = last.nodeValue.slice(0, match.index);
	var wrap = document.createElement('span');
	wrap.className = 'anchor-wrap';
	wrap.textContent = match[1];
	wrap.appendChild(svg);
	a.appendChild(wrap);
});

// Append sprite icons to external, download, video and podcast links, gluing the icon to the last word
linksWithIcon(['externallink', 'downloadlink', 'videolink', 'podcastlink']).forEach(function (a) {
	if (a.querySelector('svg.linkicon')) return;
	var icon = a.classList.contains('videolink') ? 'youtube' : (a.classList.contains('podcastlink') ? 'headphones-01' : (a.classList.contains('downloadlink') ? 'download-01' : 'link-external-02'));
	var svgMarkup = '<svg class="icon linkicon"><use href="#' + icon + '"></use></svg>';
	var last = a.lastChild;
	var match = (last && last.nodeType === 3) ? last.nodeValue.match(/(\S+)(\s*)$/) : null;
	if (match) {
		last.nodeValue = last.nodeValue.slice(0, match.index);
		var wrap = document.createElement('span');
		wrap.className = 'linkicon-wrap';
		wrap.textContent = match[1];
		wrap.insertAdjacentHTML('beforeend', svgMarkup);
		a.appendChild(wrap);
	} else {
		a.insertAdjacentHTML('beforeend', svgMarkup);
	}
});

// Copy the heading URL to the clipboard when the anchor-link icon is clicked
var anchorIconState = new WeakMap();
document.addEventListener('click', function (e) {
	var svg = e.target.closest('svg.anchor-icon');
	if (!svg) return;
	e.preventDefault();
	e.stopImmediatePropagation();
	var anchor = svg.closest('a');
	var url = anchor ? anchor.href : (location.origin + location.pathname + location.hash);
	if (navigator.clipboard && navigator.clipboard.writeText) {
		navigator.clipboard.writeText(url);
	}
	var use = svg.querySelector('use');
	var iconState = anchorIconState.get(svg) || { original: use ? use.getAttribute('href') : null, timer: null };
	anchorIconState.set(svg, iconState);
	if (use) use.setAttribute('href', '#check');
	svg.classList.add('copied');
	clearTimeout(iconState.timer);
	iconState.timer = setTimeout(function () {
		if (use) use.setAttribute('href', iconState.original);
		svg.classList.remove('copied');
	}, 1500);
});

// Glue trailing punctuation to the link icon with a word joiner so it never wraps alone
linksWithIcon(['externallink', 'downloadlink', 'videolink', 'podcastlink']).forEach(function (a) {
	var next = a.nextSibling;
	if (!next || next.nodeType !== 3) return;
	var match = next.nodeValue.match(/^\s*[.,;:)]/);
	if (!match) return;
	next.nodeValue = '\u2060' + next.nodeValue.slice(match[0].length - 1);
});
});
