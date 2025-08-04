// screens/ProductDetailsScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { apiService } from '../../api/axiosConfig';


interface Product {
  id: number;
  title: string;
  description: string;
  price: string;
  // …add any other fields your API returns
}

export default function ProductDetailsScreen({ route }: any) {
  const { productId } = route.params as { productId: number };
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
console.log(productId,'productId')
  useEffect(() => {
    (async () => {
      try {
        const res = await apiService.getProductById(productId);
        if (res.data.success) {
          setProduct(res.data.data);
        } else {
          Alert.alert('Error', res.data.message || 'Product not found');
        }
      } catch (err: any) {
        console.error('❌ getProductById error', err);
        Alert.alert(
          'Error',
          err.response?.data?.message || err.message || 'Something went wrong'
        );
      } finally {
        setLoading(false);
      }
    })();
  }, [productId]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.center}>
        <Text>Product not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{product.title}</Text>
      <Text style={styles.price}>${product.price}</Text>
      <Text style={styles.description}>{product.description}</Text>
      {/* render any other fields here */}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  price: { fontSize: 18, color: '#10b981', marginBottom: 16 },
  description: { fontSize: 16, lineHeight: 22, color: '#374151' },
});
