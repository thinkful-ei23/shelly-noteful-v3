const { JWT_SECRET } = require('../config');
//making an alias, pulling strategy from passport library and calling it JwtStrategy
const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');

const options = {
	secretOrKey: JWT_SECRET,
	jwtFromRequest: ExtractJwt.fromAuthHeaderWithScheme('Bearer'),
	algorithms: ['HS256']
};

const jwtStrategy = new JwtStrategy(options, (payload, done) => {
	done(null, payload.user);
});

module.exports = jwtStrategy;
