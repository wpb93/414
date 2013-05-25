/* 
 * order:: a func that takes 2 parameters, return an integer > 0 if the first element is larger than the second element, else return 0
 * between:: return 1 if c is between a and b, else return 0 
 * inclusive:: boolean 
 */
 function between(a,b,c,inclusive,order) {
	if (order) {
		return ((order(c,a) && order(b,c)) || (order(a,c) && order(c,b)));
	}
	else {
		if (inclusive == 0) {
			return (((a>=c) && (c>=b)) || ((a<=c) && (c<=b)));
		}
		else {
			return (((a>c) && (c>b)) || ((a<c)&&(c<b)));
		}
	}
}

