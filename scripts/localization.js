const fs = require('fs');
const path = require('path');

const PATH_TO_LANG = path.resolve(__dirname, '../locales');
const PATH_TO_ENGLISH = path.join(PATH_TO_LANG, 'en_US.json');

let sourceTerms = [];
let found = 0;

const files = [];
collectFiles(__dirname + '/../web');


files.forEach((file) => {
	const file_content = fs.readFileSync(file).toString();
	const match = /localized?\([\n\t\s]*['`"](.*?)['`"][\n\t\s]*(?:\,|\)(?!['`"]))/gs;
	const localized_matches = file_content.matchAll(match);

	if (localized_matches) {
		for (const localized_match of localized_matches) {
			let localized_string = localized_match[1];
			// Replace concatenation of strings to a single string
			localized_string = localized_string.replace(/['`"][\s\n]*\+[\s\n]*['`"]/g, '').replace(/\s+/g, ' ');

			// Replace "\n" in the string with an actual \n, simulating what JS would do
			// when evaluating it in quotes. 
			localized_string = localized_string.replace(/\\n/g, '\n').replace(/\\r/g, '\r');

			// add to sourceTerms
			sourceTerms[localized_string] = localized_string;

			found += 1;
		}
	}
});

console.log('\nUpdating en_US.json to match strings in source:');
console.log(`- ${found} localized() calls, ${Object.keys(sourceTerms).length} strings`);

writeTerms(sourceTerms, PATH_TO_ENGLISH);

removeUnused();
updateLocales();

function collectFiles(dir) {
	fs.readdirSync(dir).forEach(file => {
		const p = path.join(dir, file);
		if (fs.lstatSync(p).isDirectory()) {
			collectFiles(p);
		} else if (p.endsWith('.js') || p.endsWith('.jsx') || p.endsWith('.ts') || p.endsWith('.tsx')) {
			files.push(p);
		}
	});
}

function writeTerms(terms, destPath) {
	const ordered = {};
	Object.keys(terms)
		.sort()
		.forEach(function (key) {
			ordered[key] = terms[key];
		});
	fs.writeFileSync(destPath, JSON.stringify(ordered, null, 4));
}

function removeUnused() {
	console.log('\nRemoving unused localized strings:');
	console.log('Lang\t\tStrings\t\t\tPercent');
	console.log('------------------------------------------------');
	fs.readdirSync(PATH_TO_LANG).forEach(filename => {
		if (!filename.endsWith('.json')) return;
		const localePath = path.join(PATH_TO_LANG, filename);
		const localized = JSON.parse(fs.readFileSync(localePath).toString());

		const inuse = Object.keys(localized)
			.filter(term => sourceTerms[term])
			.reduce((obj, term) => {
				obj[term] = localized[term];
				return obj;
			}, {});

		if (inuse) {
			writeTerms(inuse, localePath);
		}

		const inuse_length = Object.keys(inuse).length;
		const source_length = Object.keys(sourceTerms).length;
		const lang = path.basename(filename, '.json');

		console.log(
			`- ${lang}\t${lang.length < 6 ? '\t' : ''}${inuse_length}\t/ ${source_length}\t\t${Math.round(inuse_length / source_length * 100)}%`
		);
	});
}

function updateLocales() {
	const english = JSON.parse(fs.readFileSync(PATH_TO_ENGLISH).toString());

	console.log('\nAdding missing localized strings:');
	console.log('Lang\t\tStrings\t\t\tPercent');
	console.log('------------------------------------------------');
	fs.readdirSync(PATH_TO_LANG).forEach(filename => {
		if (!filename.endsWith('.json') || filename === "en_US.json") return;
		const localePath = path.join(PATH_TO_LANG, filename);
		let localized = JSON.parse(fs.readFileSync(localePath).toString());
		let not_localized = 0;

		Object.keys(english).forEach(term => {
			if (!localized[term]) {
				localized[term] = null;
				not_localized += 1;
			}
		});

		if (localized) {
			writeTerms(localized, localePath);
		}

		const english_length = Object.keys(english).length;
		const lang = path.basename(filename, '.json');

		console.log(
			`- ${lang}\t${lang.length < 6 ? '\t' : ''}${not_localized}\t/ ${english_length}\t\t${Math.round(not_localized / english_length * 100)}%`
		);
	});
	console.log('\nDone!');
}