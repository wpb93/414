/* 
 * order:: a func that takes 2 parameters, return an integer > 0 if the first element is larger than the second element
 * between:: return 1 if c is between a and b, else return 0 
 */
 function between(a,b,c,order) {
	if (order) {
		return (((order(a)>order(c)) && (order(c)>order(b))) || ((order(a)<order(c))&&(order(c)<order(b))));
	}
	else {
		return (((a>c) && (c>b)) || ((a<c)&&(c<b)));
	}
}

