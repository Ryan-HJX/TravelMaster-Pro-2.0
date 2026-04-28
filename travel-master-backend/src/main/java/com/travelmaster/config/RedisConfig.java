package com.travelmaster.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.redisson.Redisson;
import org.redisson.api.RedissonClient;
import org.redisson.config.Config;
import org.springframework.boot.autoconfigure.data.redis.RedisProperties;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.cache.interceptor.SimpleKey;
import org.springframework.cache.support.SimpleValueWrapper;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;

import java.time.Duration;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.concurrent.Callable;

@Configuration
public class RedisConfig {

    @Bean
    public StringRedisTemplate stringRedisTemplate(RedisConnectionFactory connectionFactory) {
        return new StringRedisTemplate(connectionFactory);
    }

    @Bean
    public RedissonClient redissonClient(RedisProperties redisProperties) {
        Config config = new Config();
        String address = "redis://" + redisProperties.getHost() + ":" + redisProperties.getPort();
        config.useSingleServer().setAddress(address);
        if (redisProperties.getPassword() != null && !redisProperties.getPassword().isBlank()) {
            config.useSingleServer().setPassword(redisProperties.getPassword());
        }
        return Redisson.create(config);
    }

    @Bean
    public CacheManager cacheManager(RedisConnectionFactory connectionFactory, ObjectMapper objectMapper) {
        List<String> cacheNames = List.of("userProfile_v3", "postFeed", "postDetail", "creatorRanking", "hotItineraries");

        CaffeineCacheManager localCacheManager = new CaffeineCacheManager();
        localCacheManager.setCacheNames(cacheNames);
        localCacheManager.setAsyncCacheMode(false);
        localCacheManager.setAllowNullValues(false);
        localCacheManager.setCaffeine(com.github.benmanes.caffeine.cache.Caffeine.newBuilder()
                .maximumSize(1_000)
                .expireAfterWrite(Duration.ofMinutes(10)));

        // Create a dedicated ObjectMapper for Redis to handle type information correctly
        ObjectMapper redisObjectMapper = objectMapper.copy();
        redisObjectMapper.activateDefaultTyping(
                redisObjectMapper.getPolymorphicTypeValidator(),
                ObjectMapper.DefaultTyping.NON_FINAL,
                com.fasterxml.jackson.annotation.JsonTypeInfo.As.PROPERTY
        );

        RedisCacheConfiguration configuration = RedisCacheConfiguration.defaultCacheConfig()
                .serializeValuesWith(RedisSerializationContext.SerializationPair.fromSerializer(
                        new GenericJackson2JsonRedisSerializer(redisObjectMapper)))
                .entryTtl(Duration.ofMinutes(30))
                .disableCachingNullValues();

        RedisCacheManager redisCacheManager = RedisCacheManager.builder(connectionFactory)
                .cacheDefaults(configuration)
                .build();

        return new TwoLevelCacheManager(cacheNames, localCacheManager, redisCacheManager);
    }

    private static class TwoLevelCacheManager implements CacheManager {
        private final Map<String, Cache> caches;

        private TwoLevelCacheManager(Collection<String> cacheNames,
                                     CaffeineCacheManager local,
                                     RedisCacheManager remote) {
            this.caches = cacheNames.stream().collect(java.util.stream.Collectors.toMap(
                    name -> name,
                    name -> new TwoLevelCache(local.getCache(name), remote.getCache(name))
            ));
        }

        @Override
        public Cache getCache(String name) {
            return caches.get(name);
        }

        @Override
        public Collection<String> getCacheNames() {
            return caches.keySet();
        }
    }

    private static class TwoLevelCache implements Cache {
        private final Cache local;
        private final Cache remote;

        private TwoLevelCache(Cache local, Cache remote) {
            this.local = local;
            this.remote = remote;
        }

        @Override
        public String getName() {
            return local.getName();
        }

        @Override
        public Object getNativeCache() {
            return local.getNativeCache();
        }

        @Override
        public ValueWrapper get(Object key) {
            ValueWrapper localValue = local.get(key);
            if (localValue != null) {
                return localValue;
            }
            ValueWrapper remoteValue = remote.get(key);
            if (remoteValue != null) {
                local.put(key, remoteValue.get());
                return remoteValue;
            }
            return null;
        }

        @Override
        public <T> T get(Object key, Class<T> type) {
            T localValue = local.get(key, type);
            if (localValue != null) {
                return localValue;
            }
            T remoteValue = remote.get(key, type);
            if (remoteValue != null) {
                local.put(key, remoteValue);
            }
            return remoteValue;
        }

        @Override
        public <T> T get(Object key, Callable<T> valueLoader) {
            ValueWrapper current = get(key);
            if (current != null) {
                @SuppressWarnings("unchecked")
                T value = (T) current.get();
                return value;
            }
            try {
                T loaded = valueLoader.call();
                put(key, loaded);
                return loaded;
            } catch (Exception exception) {
                throw new IllegalStateException(exception);
            }
        }

        @Override
        public void put(Object key, Object value) {
            local.put(key, value);
            remote.put(key, value);
        }

        @Override
        public ValueWrapper putIfAbsent(Object key, Object value) {
            ValueWrapper existing = get(key);
            if (existing == null) {
                put(key, value);
                return null;
            }
            return existing;
        }

        @Override
        public void evict(Object key) {
            local.evict(key);
            remote.evict(key);
        }

        @Override
        public boolean evictIfPresent(Object key) {
            local.evict(key);
            return remote.evictIfPresent(key);
        }

        @Override
        public void clear() {
            local.clear();
            remote.clear();
        }

        @Override
        public boolean invalidate() {
            local.clear();
            return remote.invalidate();
        }
    }
}
