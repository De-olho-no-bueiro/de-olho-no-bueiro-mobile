import { useState } from 'react';
import { useAuth } from '@/core/contexts/auth-context';
import { Alert } from 'react-native';

export function useAuthViewModel() {
  const { signIn, signUp, isLoading: isAuthLoading } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Erro', 'Preencha email e senha.');
      return;
    }
    if (!email.includes('@')) {
      Alert.alert('Erro', 'Insira um e-mail válido.');
      return;
    }
    setIsSubmitting(true);
    try {
      await signIn(email, password);
    } catch (error) {
       Alert.alert('Erro', 'Falha ao logar.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert('Erro', 'Preencha todos os campos.');
      return;
    }
    if (!email.includes('@')) {
      Alert.alert('Erro', 'Insira um e-mail válido.');
      return;
    }
    setIsSubmitting(true);
    try {
      await signUp(name, email, password);
    } catch (error) {
       Alert.alert('Erro', 'Falha ao cadastrar.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    name,
    setName,
    email,
    setEmail,
    password,
    setPassword,
    isSubmitting,
    isAuthLoading,
    handleLogin,
    handleRegister,
  };
}
