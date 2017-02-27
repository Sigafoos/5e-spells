$(document).ready(parseSpells);

function parseSpells() {
	if (!localStorage['spells']) {
		console.log('getting spell data from server...');
		$.getScript('https://dl.dropboxusercontent.com/s/wneq3reu80vdlkb/spellData.json', function() {
				localStorage['spells'] = JSON.stringify(jsonSpellData);
				jsonSpellData.forEach(appendSpell);
				});
	} else {
		JSON.parse(localStorage['spells']).forEach(appendSpell);
	}

	$('#filters').change(filterSpells);
}

function appendSpell(spell) {
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
		addSpellAttr(panel, key, attrs[key]);
	}

	var heading = $('<div></div>')
		.addClass('panel-heading')
		.text(spell.name);

	var info = $('<span></span>')
		.addClass('pull-right')
		.text(spell.level + ' ' + spell.school);
	heading.append(info);

	var body = $('<div><div>')
		.addClass('panel-body');

	var footer = $('<div></div>')
		.addClass('panel-footer')
		.text(tags.concat(attrs.classes).join(', '));

	body.append($.parseHTML(spell.desc));
	if (spell.higher_level) {
		body.append($.parseHTML(spell.higher_level));
	}
	heading.appendTo(panel);
	body.appendTo(panel);
	footer.appendTo(panel);
	panel.appendTo($('#spells'));
}

function parseAttrs(spell) {
	return {
		verbal: (spell.components.indexOf('V') !== -1),
		somantic: (spell.components.indexOf('S') !== -1), // motion
		material: (spell.components.indexOf('M') !== -1),
		ritual: (spell.ritual == 'yes'),
		concentration: (spell.concentration == 'yes'),
		level: (spell.level.substr(0, 1) == 'C') ? 0 : spell.level.substr(0, 1),
		classes: spell.class.split(', '),
		school: spell.school
	};
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
	$('.panel').hide();

	var classes = $('#classes').find(':checked').map(function() { return this.id; }).get();
	var levels = $('#levels').find(':checked').map(function() { return this.id.substr(3); }).get();
	$('.panel').filter(function() {
		if (!filterByClass(this, classes)) {
			return false;
		}

		if (!filterByLevel(this, levels)) {
			return false;
		}

		// you've reached the end and passed!
		return true;
	}).show();
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
