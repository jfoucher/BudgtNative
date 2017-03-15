import moment from 'moment'

export const getAvailableMonths = (transactions) => {
    //Return transaction that correspond to the month given in the filter
    const dates = transactions.map((transaction) => {
        const date = moment(transaction.date);

        return date.format('YYYYMM');
    }).filter((t) => {
        return !t._deleted;
    });
    const months = [...new Set(dates)].sort((a, b) => {
        return parseInt(b, 10) - parseInt(a, 10);
    });
    var years = [], previousYear;
    for(var i = 0; i < months.length; i++) {
        var y = months[i].substr(0,4);
        if(typeof previousYear === 'undefined') {
            years[0] = [];
            years[0].push(months[i])
        } else if(y === previousYear) {
            years[years.length-1].push(months[i]);
        } else if (y !== previousYear) {
            years[years.length] = [];
            years[years.length-1].push(months[i]);
        }

        previousYear = y
    }

    return years;
}

export const getNumberOfTransactionsByMonth = (transactions) => {
    var transactionsPerMonth = {};
    for(var i = 0; i < transactions.length;i++) {
        if(transactions[i]._deleted) {
            continue;
        }
        const date = moment(transactions[i].date);
        const d = date.format('YYYYMM');
        if(typeof transactionsPerMonth[d] === "undefined") {
            transactionsPerMonth[d] = 1;
        } else {
            transactionsPerMonth[d] += 1;
        }

    }
    return transactionsPerMonth;
}

export const getCategoriesForTime = (transactions, time) => {
    var categoryIndex = {};
    var categories = [];
    var total = 0;
    const format = time.length === 4 ? 'YYYY' : 'YYYYMM';
    transactions.forEach((t) => {
        if(moment(t.date).format(format) !== time) {
            return;
        }
        if(t.amount) {
            total += t.amount;
        }

        if(typeof categoryIndex[t.category.name] === 'undefined') {
            categories.push({color: t.category.color, name: t.category.name, amount: t.amount, transactions:[t]});
            categoryIndex[t.category.name] = categories.length-1;
        } else {
            if(t.amount) {
                categories[categoryIndex[t.category.name]].amount += t.amount;
            } else {
                t.amount = 0;
            }

            categories[categoryIndex[t.category.name]].transactions.push(t);
        }
    });

    var other = {name: 'Other', amount: 0, color:"#999999", categories: []};
    const cats = categories.sort((c1, c2) => {
        return c1.amount < c2.amount ? 1 : -1
    }).filter((c) => {
        //remove categories with very small percentage of total
        if(c.amount/total > 0.05) {
            return true;
        }
        other.amount += c.amount;
        other.categories.push(c);
        return false;
    });
    if(cats.length && other.amount > 0) {
        //Only add "other" category if there are more categories to display and the amount is positive
        cats.push(other);
    }



    return {categories: cats, total: total};
}

export const getTransactionsForCategoryAndTime = (transactions, category, time) => {
    var total = 0;
    const format = time.length === 4 ? 'YYYY' : 'YYYYMM';
    const newtransactions =  transactions.filter((t) => {
        if(category && t.category.name === category.name && moment(t.date).format(format) === time) {
            if(t.amount) {
                total += t.amount;
            }

            return true;
        }
        return false;
    }).sort((t1, t2) => {
        return t1.amount < t2.amount ? 1 : -1;
    });

    return {transactions: newtransactions, total: total};
}