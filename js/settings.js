import{getOne,putOne}from'./db.js';
export let settings={id:'app',showCalc:true};
export async function loadSettings(){settings={...settings,...(await getOne('settings','app')||{})};return settings}
export async function saveSettings(patch){settings={...settings,...patch,id:'app'};await putOne('settings',settings);return settings}
