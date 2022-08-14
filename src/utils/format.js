import distanceInWordsToNow from 'date-fns/distance_in_words_to_now';
import ruLocale from 'date-fns/locale/ru';

export function formatValue(v) {
    try {
        return `${v.toFixed(2)} T`;
    } catch(err) {
        return '0 T';
    }
}

export function paymentToText(item, captions) {
    let itemList = [];
    if (parseFloat(item.authorValue)) {
        itemList.push(`${captions["manageIncomeAuthorSimple"]} ${item.authorValue} T`);
    }
    if (parseFloat(item.readerValue)) {
        itemList.push(`${captions["manageIncomeReaderSimple"]} ${item.readerValue} T`);
    }
    if (parseFloat(item.referalValue)) {    
        itemList.push(`${captions["manageIncomeReferalSimple"]} ${item.referalValue} T`);
    }
    if (itemList.length) {
        return `${captions['manageIncome']}: ${itemList.join(', ')}`;
    }
    return ''
}

export function withdrawalToText(item, captions) {
    switch(item.status) {
        case 'completed':
            return captions["manageWithdrawalComplete"];
        case 'failed':
            return captions["manageWithdrawalError"];
        default:
            return '';
    }
}

export function formatDate(d, lang='ru') {
    try {
        const options = lang === 'ru' ? {locale: ruLocale} : {};
        let formattedDate = distanceInWordsToNow(d, options);
        return formattedDate;
    } catch(err) {
        return '';
    }
    
}

export function textToHtml(text) {
    try {
        const textItems = text.split('\n').map((itm) => {
            return `<p>${itm}</p>`;
        });
        return textItems.join('');

    } catch(err) {
        return text;
    }
}