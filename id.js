//Id generator 
function rnd8() {return (Math.random().toString(16) + "000000000").substr(2, 8); }
module.exports = function () {return rnd8() + rnd8(); };