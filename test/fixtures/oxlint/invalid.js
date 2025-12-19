// This should trigger the prefer-includes rule
if (arr.indexOf(item) !== -1) {
  console.log('found');
}

// Another violation
const hasItem = list.indexOf(value) > -1;
