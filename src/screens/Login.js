// import React, { useState } from 'react';
// import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
// import { authService } from '../services/auth.service';

// const Login = ({ navigation }) => {
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [loading, setLoading] = useState(false);

//   const handleLogin = async () => {
//     setLoading(true);
//     try {
//       const response = await authService.login(email, password);
//       if (response.success) {
//         // Navigate to the next screen or handle successful login
//         navigation.navigate('Home');
//       } else {
//         Alert.alert('Error', response.message);
//       }
//     } catch (error) {
//       Alert.alert('Error', 'An error occurred during login');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <View style={styles.container}>
//       <View style={styles.shadowBox}>
//       <Text style={styles.title}>Login</Text>
//       <TextInput
//         style={styles.input}
//         placeholder="Email"
//         value={email}
//         onChangeText={setEmail}
//         keyboardType="email-address"
//         autoCapitalize="none"
//       />
//       <TextInput
//         style={styles.input}
//         placeholder="Password"
//         value={password}
//         onChangeText={setPassword}
//         secureTextEntry
//       />
//       <TouchableOpacity 
//         style={[styles.button, loading && styles.buttonDisabled]}
//         onPress={handleLogin}
//         disabled={loading}
//       >
//         <Text style={styles.buttonText}>
//           {loading ? 'Logging in...' : 'Login'}
//         </Text>
//       </TouchableOpacity>
//     </View>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     justifyContent: 'center',
//     padding: 20,
//   },
//  shadowBox: {
//   backgroundColor: '#fff',
//   padding: 20,
//   borderRadius: 10,
//   shadowColor: '#000',
//   shadowOffset: { width: 0, height: 6 },
//   shadowOpacity: 0.4,
//   shadowRadius: 10,
//   elevation: 10, // Android shadow
//   marginBottom: 30, // Space to render shadow
// },


//   title: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     marginBottom: 20,
//     textAlign: 'center',
//   },
//  input: {
//   borderWidth: 1,
//   borderColor: '#ddd',
//   padding: 10,
//   marginBottom: 15,
//   borderRadius: 5,
//   backgroundColor: '#fff',
//   shadowColor: '#000',
//   shadowOffset: { width: 0, height: 2 },
//   shadowOpacity: 0.2,
//   shadowRadius: 5,
//   elevation: 5, // Android
// },

// button: {
//   backgroundColor: '#007AFF',
//   padding: 15,
//   borderRadius: 5,
//   alignItems: 'center',
//   shadowColor: '#000',
//   shadowOffset: { width: 0, height: 4 },
//   shadowOpacity: 0.3,
//   shadowRadius: 6,
//   elevation: 6,
// },

//   buttonDisabled: {
//     backgroundColor: '#ccc',
//   },
//   buttonText: {
//     color: 'white',
//     fontSize: 16,
//     fontWeight: 'bold',
//   },
// });

// export default Login; 