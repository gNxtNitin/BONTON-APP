import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Image,
} from 'react-native';
// import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {Colors} from '../constatnst/Colors';

const IconButton = ({
  iconName,
  title,
  size,
  style,
  isImage = false,
  disabled = false,
  isPressed = false,
  ...props
}) => {
  return (
    <TouchableOpacity 
      style={[
        styles.button,
        isPressed && styles.pressedButton
      ]}
      {...props}
      disabled={disabled}
      activeOpacity={disabled ? 1 : 0.7}
    >
      {isImage ? (
        <Image 
          source={iconName} 
          style={[
            styles.icon, 
            { 
              width: size, 
              height: size, 
              tintColor: props.tintColor || '#fff'
            }
          ]} 
          resizeMode="contain"
        />
      ) : (
        <Text style={[
          styles.icon, 
          { fontSize: size }
        ]}>{iconName}</Text>
      )}
      <Text style={[
        styles.btnText,
        isPressed && styles.pressedText
      ]}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    backgroundColor: '#C7E8E5',
    width: '100%',
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    shadowColor: Colors.black,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  pressedButton: {
    backgroundColor: '#9ED3CD',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.2,
    elevation: 2,
  },
  icon: {
    tintColor: '#fff',
  },
  btnText: {
    color: '#014B6E',
    fontSize: 14,
    fontWeight: '500',
  },
  pressedText: {
    color: '#013B56',
  }
});

export default IconButton; 