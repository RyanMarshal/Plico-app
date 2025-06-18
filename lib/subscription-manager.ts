// Centralized Subscription Manager for Supabase Realtime
// This module manages all real-time subscriptions globally to handle React StrictMode gracefully

import { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from './supabase-client'

// Type definitions
type SubscriptionCallback = (payload: any) => void

interface ChannelInfo {
  channel: RealtimeChannel
  callbacks: Set<SubscriptionCallback>
}

class SubscriptionManager {
  // Map to store active channels and their associated callbacks
  private channels: Map<string, ChannelInfo> = new Map()
  // Map to store cleanup timers for channels
  private cleanupTimers: Map<string, NodeJS.Timeout> = new Map()

  constructor() {
    // Subscription manager initialized
  }

  public subscribe(channelName: string, callback: SubscriptionCallback): void {
    // Clear any pending cleanup for this channel
    const cleanupTimer = this.cleanupTimers.get(channelName)
    if (cleanupTimer) {
      clearTimeout(cleanupTimer)
      this.cleanupTimers.delete(channelName)
    }
    
    const existingChannel = this.channels.get(channelName)
    
    if (existingChannel) {
      // Channel already exists, just add the callback
      existingChannel.callbacks.add(callback)
      return
    }

    // Create new channel
    
    // Extract poll ID from channel name (format: plico-results-{pollId})
    const pollId = channelName.replace('plico-results-', '')
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'Option',
          filter: `plicoId=eq.${pollId}`,
        },
        (payload) => {
          // Get current callbacks for this channel
          const channelInfo = this.channels.get(channelName)
          if (channelInfo) {
            // Call all registered callbacks
            channelInfo.callbacks.forEach(cb => {
              try {
                cb(payload)
              } catch (error) {
                console.error(`❌ [SUBSCRIPTION MANAGER] Error in callback:`, error)
              }
            })
          }
        }
      )
      .subscribe((status, error) => {
        if (error) {
          console.error(`[SUBSCRIPTION MANAGER] Channel ${channelName} error:`, error)
        }
      })

    // Store the channel with its callback
    this.channels.set(channelName, {
      channel,
      callbacks: new Set([callback])
    })
  }

  public unsubscribe(channelName: string, callback: SubscriptionCallback): void {
    const channelInfo = this.channels.get(channelName)
    
    if (!channelInfo) {
      return
    }

    // Remove the callback
    channelInfo.callbacks.delete(callback)

    // If no more callbacks, schedule cleanup
    if (channelInfo.callbacks.size === 0) {
      
      // In development, delay cleanup to handle React StrictMode
      const cleanupDelay = process.env.NODE_ENV === 'development' ? 500 : 0
      
      const timer = setTimeout(() => {
        // Double-check that there are still no callbacks
        const currentInfo = this.channels.get(channelName)
        if (currentInfo && currentInfo.callbacks.size === 0) {
          // Unsubscribe from Supabase
          supabase.removeChannel(currentInfo.channel)
          
          // Remove from our maps
          this.channels.delete(channelName)
          this.cleanupTimers.delete(channelName)
        }
      }, cleanupDelay)
      
      this.cleanupTimers.set(channelName, timer)
    }
  }
}

// Export a singleton instance
export const subscriptionManager = new SubscriptionManager()