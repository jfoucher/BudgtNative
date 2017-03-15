import { COLOR } from 'react-native-material-ui';

export const shadeColor = (color, percent) => {
    if(!color) {
        return "#ffffff";
    }
    var f=parseInt(color.slice(1),16),t=percent<0?0:255,p=percent<0?percent*-1:percent,R=f>>16,G=f>>8&0x00FF,B=f&0x0000FF;
    return "#"+(0x1000000+(Math.round((t-R)*p)+R)*0x10000+(Math.round((t-G)*p)+G)*0x100+(Math.round((t-B)*p)+B)).toString(16).slice(1);
}

export const guid = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        // eslint-disable-next-line
        var r = Math.random()*16|0, v = c === 'x' ? r : (r&0x3|0x8);
        return v.toString(16);
    });
}

export const getRandomColor = () => {

    const colors = ['red', 'pink', 'purple', 'indigo', 'blue', 'lightBlue', 'cyan', 'teal', 'green', 'lightGreen', 'lime', 'yellow', 'amber', 'orange', 'deepOrange', 'blueGrey']

    const nuances = [
        '200', '400', '700', '900', 'A200', 'A400', 'A700'
    ];

    var randomPropertyName = colors[ Math.floor(Math.random()*colors.length) ] + nuances[ Math.floor(Math.random()*nuances.length) ];
    if(COLOR[randomPropertyName]) {
        return COLOR[randomPropertyName]
    } else {
        return getRandomColor();
    }
}

export const getTextColor = (backgroundColor) => {

    if(!backgroundColor) {
        return "#ffffff";
    }
    console.log('getTextColor', backgroundColor);

    const m = backgroundColor.match(/^#([0-9a-f]{6})$/i)[1];
    var brightness = 0;
    if( m) {

        brightness = (299*parseInt(m.substr(0,2),16)+
            587*parseInt(m.substr(2,2),16)+
            114*parseInt(m.substr(4,2),16))/1000

    }

    var textColor = '#FFFFFF';
    if(brightness > 180) {
        textColor = '#333333';
    }

    return textColor;
}