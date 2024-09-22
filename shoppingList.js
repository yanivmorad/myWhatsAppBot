const shoppingList = new Set(); // שימוש ב-Set לאחסון פריטים ייחודיים

// פונקציה לניהול רשימת הקניות
const handleShoppingList = async (message) => {
    const words = message.body.split(' ');

    if (words.length === 1) {
        // אם רק כתבו 'קניות', הצג את כל הרשימה
        if (shoppingList.size === 0) {
            await message.reply('רשימת הקניות ריקה.');
        } else {
            await message.reply(`רשימת הקניות:\n${[...shoppingList].join('\n')}`);
        }
    } 
    
    else if (words[1] === 'איפוס') {
        // איפוס הרשימה
        shoppingList.clear();
        await message.reply('רשימת הקניות אופסה.');
    } 
    
    else if (words[1] === 'עריכה') {
        // שליחת רשימת הקניות הנוכחית לעריכה
        if (shoppingList.size === 0) {
            await message.reply('אין פריטים ברשימה כדי לערוך.');
        } else {
            await message.reply(`העתק את הכותרת 'קניות מעודכנות' ושלח את הרשימה החדשה שלך.  \n\n קניות מעודכנות\n${[...shoppingList].join('\n')}`);
        }
    } 
    
    else if (message.body.startsWith("קניות מעודכנות")) {
        
        
        // עדכון רשימת הקניות עם רשימה מעודכנת שנשלחה
        const updatedList = message.body.replace('קניות מעודכנות', '').trim();
        const updatedItems = updatedList.split(','||'\n').map(item => item.trim());

        shoppingList.clear(); // איפוס הרשימה הקיימת
        updatedItems.forEach(item => shoppingList.add(item)); // הוספת הפריטים החדשים
        
        await message.reply('רשימת הקניות עודכנה.');
    } else {
        // הוספת פריט חדש לרשימה
        const newItem = words.slice(1).join(' ');

        if (shoppingList.has(newItem)) {
            await message.reply(`${newItem} כבר קיים ברשימת הקניות.`);
        } else {
            shoppingList.add(newItem);
            await message.reply(`${newItem} נוסף לרשימת הקניות.`);
        }
    }
};

module.exports = { handleShoppingList };
