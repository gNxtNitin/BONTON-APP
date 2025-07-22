import React, {useState, useEffect} from 'react';
import DropDownPicker from 'react-native-dropdown-picker';
import {StyleSheet, View, Text} from 'react-native';
import {Colors} from '../constatnst/Colors';

const CustomDropdown = ({
  items,
  placeholder,
  value,
  onValueChange,
  containerStyle,
  dropdownStyle,
  dropdownContainerStyle,
  disabled,
  zIndex = 1000,
  label,
  required,
  isOpen,
  onOpen,
  onClose
}) => {
  const [internalItems, setItems] = useState(items || []);
  const [open, setOpen] = useState(false);
  const [internalValue, setInternalValue] = useState(value);

  // Update internal items when items prop changes
  useEffect(() => {
    setItems(items || []);
  }, [items]);

  // Update internal value when prop changes
  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  // Update open state when prop changes
  useEffect(() => {
    if (isOpen !== undefined) {
      setOpen(isOpen);
    }
  }, [isOpen]);

  const handleValueChange = (val) => {
    setInternalValue(val);
    if (onValueChange) {
      onValueChange(val);
    }
  };

  const handleOpen = () => {
    setOpen(true);
    if (onOpen) {
      onOpen();
    }
  };

  const handleClose = () => {
    setOpen(false);
    if (onClose) {
      onClose();
    }
  };

  return (
    <View style={[styles.dropdownWrapper, { zIndex }, open ? { elevation: 5 } : {}]}>
      {label && (
        <View style={styles.labelContainer}>
          <Text style={styles.label}>{label}</Text>
          {required && <Text style={styles.requiredText}>*</Text>}
        </View>
      )}
      <DropDownPicker
        open={open}
        value={internalValue}
        items={internalItems}
        setOpen={setOpen}
        setValue={handleValueChange}
        setItems={setItems}
        placeholder={placeholder}
        style={[styles.dropdown, dropdownStyle]}
        containerStyle={[styles.dropdownContainer, containerStyle]}
        dropDownContainerStyle={[styles.dropdownList, dropdownContainerStyle]}
        textStyle={styles.dropdownText}
        labelStyle={styles.dropdownLabel}
        placeholderStyle={styles.placeholderText}
        arrowIconStyle={styles.arrowIcon}
        listItemLabelStyle={styles.listItemLabel}
        selectedItemLabelStyle={styles.selectedItemLabel}
        listMode="SCROLLVIEW"
        scrollViewProps={{
          nestedScrollEnabled: true,
        }}
        disabled={disabled}
        searchable={false}
        closeAfterSelecting={true}
        showTickIcon={true}
        itemSeparator={true}
        itemSeparatorStyle={{
          backgroundColor: 'rgba(1, 75, 110, 0.1)',
        }}
        onOpen={handleOpen}
        onClose={handleClose}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  dropdownWrapper: {
    position: 'relative',
    marginBottom: 2,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  label: {
    fontSize: 14,
    color: 'rgba(1, 75, 110, 0.7)',
    marginTop: 12,
    fontFamily: 'Montserrat',
  },
  requiredText: {
    color: 'red',
    fontSize: 16,
    marginLeft: 5,
    marginTop: 12,
  },
  dropdown: {
    borderColor: Colors.white,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderRadius: 8,
    minHeight: 48,
  },
  dropdownContainer: {
    width: '100%',
  },
  dropdownList: {
    backgroundColor: 'rgba(180, 229, 222, 1)',
    borderColor: Colors.white,
    borderWidth: 1,
    borderRadius: 8,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  dropdownText: {
    color: '#014B6E',
    fontSize: 12,
    fontFamily: 'Montserrat-Regular',
  },
  dropdownLabel: {
    color: '#014B6E',
    fontSize: 12,
    fontFamily: 'Montserrat-Regular',
  },
  placeholderText: {
    color: 'rgba(1, 75, 110, 0.5)',
    fontSize: 12,
    fontFamily: 'Montserrat-Regular',
  },
  listItemLabel: {
    color: '#014B6E',
    fontSize: 12,
    fontFamily: 'Montserrat-Regular',
  },
  selectedItemLabel: {
    color: '#014B6E',
    fontSize: 12,
    fontFamily: 'Montserrat-Regular',
    fontWeight: 'normal',
  },
  arrowIcon: {
    tintColor: 'rgba(1, 75, 110, 0.7)',
  },
});

export default CustomDropdown; 