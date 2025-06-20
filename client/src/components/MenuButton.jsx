import React from 'react';
import * as MenuStyles from '../styles/menuStyle.js';

function MenuButton(props) {
    return (
        <button className= {MenuStyles.menuItemBaseStyle} onClick={props.onClick}>
            {props.label}
        </button>
    );
}

export default MenuButton;