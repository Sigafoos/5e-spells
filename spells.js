$(document).ready(parseSpells);

var saveIcon = $('<span></span>')
	.addClass('glyphicon')
	.addClass('glyphicon-plus')
	.attr('aria-hidden', true);
saveButton = $('<button></button>')
	.addClass('btn')
	.addClass('btn-default')
	.addClass('save-spell')
	.addClass('pull-right')
	.attr('aria-label', 'save to spell list')
	.attr('title', 'save to spell list')
	.append(saveIcon);

var deleteIcon = $('<span></span>')
	.addClass('glyphicon')
	.addClass('glyphicon-minus')
	.attr('aria-hidden', true);
deleteButton = $('<button></button>')
	.addClass('btn')
	.addClass('btn-default')
	.addClass('delete-spell')
	.addClass('pull-right')
	.attr('aria-label', 'delete from spell list')
	.attr('title', 'delete from spell list')
	.append(deleteIcon);

function parseSpells() {
	if (!localStorage['spells']) {
		console.log('getting spell data from server...');
		$.getScript('https://dl.dropboxusercontent.com/s/wneq3reu80vdlkb/spellData.json', function() {
				localStorage['spells'] = JSON.stringify(jsonSpellData);
				localStorage['saved'] = JSON.stringify([]);
				savedSpells = [];
				jsonSpellData.forEach(appendSpell);
				updateUI();
				console.log('spell data saved');
				});
	} else {
		featureCheck();
		savedSpells = JSON.parse(localStorage['saved']); // globally scoped
		if (savedSpells.length !== 0) {
			$('#saved').parent().removeAttr('disabled');
		}
		JSON.parse(localStorage['spells']).forEach(appendSpell);
		updateUI();
	}

	$('#filters').change(filterSpells);
	$('#text').keyup(filterSpells);
	$('#saved').click(filterSpells);
	$('.save-spell').click(saveSpell);
	$('.delete-spell').click(deleteSpell);
	$('#refresh').click(localStorageRefresh);
}

function appendSpell(spell) {
	var wrapper = $('<div></div>')
		.addClass('spell')
		.addClass('col-sm-6')
		.addClass('col-md-4')
		.addClass('col-lg-3')
		;

	var panel = $('<div></div>')
		.addClass('panel')
		.addClass('panel-default')
		;

	var attrs = parseAttrs(spell);
	var tags = [];
	for (var key in attrs) {
		if (attrs[key] === true) {
			tags.push(key);
		}
		addSpellAttr(wrapper, key, attrs[key]);
	}

	var heading = $('<div></div>')
		.addClass('panel-heading');

	if (savedSpells.indexOf(spell.name) !== -1) {
		heading.append(deleteButton.clone());
		wrapper.attr('data-saved', true);
	} else {
		heading.append(saveButton.clone());
	}

	var spellName = $('<h3></h3>')
		.addClass('spell-name')
		.addClass('panel-title')
		.text(spell.name);
	heading.append(spellName);

	var info = $('<small></small>')
		.text(spell.level + ' ' + spell.school);
	heading.append(info);

	var body = $('<div><div>')
		.addClass('panel-body');

	body.append($.parseHTML(spell.desc));
	if (spell.higher_level) {
		body.append($.parseHTML(spell.higher_level));
	}

	body.append($('<div></div>').text('Casting time: ' + spell.casting_time));
	body.append($('<div></div>').text('Duration: ' + spell.duration));
	body.append($('<div></div>').text('Range: ' + spell.range));
	body.append($('<div></div>').text('Source: ' + spell.page));

	var footerText = tags.concat(attrs.classes);
	if (attrs.oaths) {
		footerText = footerText.concat(attrs.oaths);
	}
	var footer = $('<div></div>')
		.addClass('panel-footer')
		.text(footerText.join(', '));

	panel.append(heading)
		.append(body)
		.append(footer)
	wrapper.append(panel);
	$('#spells').append(wrapper);
}

function parseAttrs(spell) {
	var attrs = {
		verbal: (spell.components.indexOf('V') !== -1),
		somantic: (spell.components.indexOf('S') !== -1), // motion
		material: (spell.components.indexOf('M') !== -1),
		ritual: (spell.ritual == 'yes'),
		concentration: (spell.concentration == 'yes'),
		level: (spell.level.substr(0, 1) == 'C') ? 0 : spell.level.substr(0, 1),
		classes: spell.class.split(', '),
		school: spell.school.toLowerCase()
	};

	if (spell.oaths) {
			attrs.oaths = spell.oaths.split(', ');
	}
	return attrs;
}

function addSpellAttr(panel, key, val) {
	if (typeof val == 'object'){
		val.forEach(function(attr) {
			panel.attr('data-' + attr.toLowerCase().replace(' ', '-'), true);
		});
	} else {
		panel.attr('data-' + key, val);
	}
}

function filterSpells() {
	$('.spell').hide();

	var classes = $('#classes').find(':checked').map(function() { return this.id; }).get();
	var levels = $('#levels').find(':checked').map(function() { return this.id.substr(3); }).get();
	var schools = $('#schools').find(':checked').map(function() { return this.id; }).get();
	var spellName = $('#text').val().toLowerCase();

	$('.spell').filter(function() {
		if ($('#saved').is(':checked') && $(this).attr('data-saved') !== "true") {
			return false;
		}

		if (!filterByClass(this, classes)) {
			return false;
		}

		if (!filterByLevel(this, levels)) {
			return false;
		}

		if ($('#conc-yes').is(':checked') && !$(this).data('concentration')) {
			return false;
		}
		if ($('#conc-no').is(':checked') && $(this).data('concentration')) {
			return false;
		}

		if ($('#rit-yes').is(':checked') && !$(this).data('ritual')) {
			return false;
		}
		if ($('#rit-no').is(':checked') && $(this).data('ritual')) {
			return false;
		}

		if (!filterBySchool(this, schools)) {
			return false;
		}

		if (spellName && $(this).find('.spell-name')[0].textContent.toLowerCase().indexOf(spellName) == -1) {
			return false;
		}

		// you've reached the end and passed!
		return true;
	}).show();

	updateUI();
}

function filterByClass(el, classes) {
	if (classes.length > 0) {
		var inClass = false;
		classes.forEach(function(className) {
			if ($(el).data(className) == true) {
				inClass = true;
				return true;
			}
		});
		return inClass;
	}
	return true;
}

function filterByLevel(el, levels) {
	if (levels.length > 0) {
		var inLevel = false;
		levels.forEach(function(lvl) {
			if ($(this).data('level') == lvl) {
				inLevel = true;
				return true;
			}
		}.bind(el));
		return inLevel;
	}
	return true;
}

function filterBySchool(el, schools) {
	if (schools.length > 0) {
		var inSchool = false;
		schools.forEach(function(schoolName) {
			if ($(el).data('school') == schoolName) {
				inSchool = true;
				return true;
			}
		});
		return inSchool;
	}
	return true;
}

function updateUI() {
	$('.spell-fix').remove();
	var clearfix = $('<div></div>')
		.addClass('clearfix')
		.addClass('spell-fix')
		;
	$('.spell:visible').each(function(i) {
		if ((i + 1) % 2 == 0) {
			$(this).after(clearfix.clone().addClass('visible-sm-block'));
		}
		if ((i + 1) % 3 == 0) {
			$(this).after(clearfix.clone().addClass('visible-md-block'));
		}
		if ((i + 1) % 4 == 0) {
			$(this).after(clearfix.clone().addClass('visible-lg-block'));
		}
	});

	$('#spell-visible').text($('.spell:visible').length);
	$('#spell-total').text($('.spell').length);
}

function saveSpell() {
	var spellName = $(this).parent().find('.spell-name')[0];
	if (spellName == undefined) {
		return false;
	}
	spellName = spellName.textContent;
	if (savedSpells.indexOf(spellName) == -1) {
		savedSpells.push(spellName);
		updateSaved();
		$(this).parents('.spell').attr('data-saved', true);
		$(this).parent().prepend(deleteButton.clone());
		$(this).remove();

		// rebind
		$('.delete-spell').click(deleteSpell);
	}
}

function deleteSpell() {
	var spellName = $(this).parent().find('.spell-name')[0];
	if (spellName == undefined) {
		return false;
	}
	spellName = spellName.textContent;
	var i = savedSpells.indexOf(spellName);
	if (i != -1) {
		savedSpells.splice(i, 1)
		$(this).parents('.spell').removeAttr('data-saved');
		$(this).parent().prepend(saveButton.clone());
		$(this).remove();

		// rebind
		$('.save-spell').click(saveSpell);

		// removing it means it should disappear
		if ($('#saved').is(':checked')) {
			filterSpells();
		}

		updateSaved();
	}
}

function updateSaved() {
	localStorage['saved'] = JSON.stringify(savedSpells);
	if (savedSpells.length === 0) {
		// don't trap yourself in saved only
		if ($('#saved').is(':checked')) {
			$('#saved').parent().click();
		}
		$('#saved').parent().attr('disabled', true);
	} else if (savedSpells.length === 1) {
		$('#saved').parent().removeAttr('disabled');
	}
}

function featureCheck() {
	if (!localStorage['saved']) {
		var upgrade = $('<div></div>')
			.addClass('alert')
			.addClass('alert-danger')
			.addClass('text-center')
			.attr('role', 'alert')
			.text('Your spell list is out of date! ');
		upgrade.append($('<strong><a href="#" class="text-danger" id="refresh">Update now!</a></strong>'));
		upgrade.insertAfter('h1');
	}
}

function localStorageRefresh() {
	localStorage.removeItem('spells');
	location.reload();
}
