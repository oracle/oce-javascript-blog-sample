/**
 * Copyright (c) 2020 Oracle and/or its affiliates. All rights reserved.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */

define([
  'jquery',
  'contentSDK',
  'scripts/server-config-utils.js',
  'scripts/utils.js',
  'scripts/services.js',
], ($, contentSDK, serverUtils, utils, services) => {
  /**
   * Create and populate the <img> used to represent the thumbnail of the article
   *
   * For tutorial purposes only, any errors are simply logged to the console
   *
   * @returns none
   * @param {object} parentContainer - The DOM element into which the list of articles will render
   * @param {string} thumbnailIdentifier - The identifier of the thumbnail to display
   *
   */
  function createArticleThumbnail(
    deliveryClient,
    articleContainer,
    imageIdentifier,
  ) {
    // create the image element first else placement is not guaranteed as it will depend
    // on when response comes back
    const imgElement = $('<img />').appendTo(articleContainer);
    services
      .getMediumRenditionURL(deliveryClient, imageIdentifier)
      .then((url) => {
        imgElement.attr('src', url);
      })
      .catch((error) => console.error(error));
  }

  /**
   * Create the DOM element that will contain a single article
   *
   * Articles are formatted accordinding the CSS defined for the class #articles .article
   *
   * @returns {object} - the DOM container for this single article
   * @param {object} parentContainer - The DOM element into which the list of articles will render
   * @param {object} article - The article to display
   *
   */
  function createArticleListItem(
    deliveryClient,
    parentContainer,
    article,
    topicName,
    topicId,
  ) {
    const articleContainer = $('<div />')
      .attr('class', 'article')
      .click(() => {
        window.location.href = `article.html?articleId=${article.id}&topicName=${topicName}&topicId=${topicId}`;
      })
      .appendTo(parentContainer);
    const div = $('<div>')
      .attr('class', 'title-date')
      .appendTo(articleContainer);
    $('<h4 />').attr('class', 'title').text(article.name).appendTo(div);
    $('<div />')
      .text(`Posted on ${utils.dateToMDY(article.fields.published_date.value)}`)
      .attr('class', 'date')
      .appendTo(div);
    createArticleThumbnail(
      deliveryClient,
      articleContainer,
      article.fields.image.id,
    );

    $('<div />')
      .text(article.description)
      .attr('class', 'description')
      // .text(article.fields.articlecontent)
      .appendTo(articleContainer);

    return articleContainer;
  }

  /**
   *  When the document has finished loading, fetch data from the SDK.
   *  For tutorial purposes only, any errors encountered are logged to the console
   */
  $(document).ready(() => {
    // Get the server configuration from the "oce.json" file
    serverUtils.parseServerConfig
      .then((serverconfig) => {
        // Obtain the delivery client from the Content Delivery SDK
        const deliveryClient = contentSDK.createDeliveryClient(serverconfig);

        const params = new URLSearchParams(window.location.search);
        const topicId = decodeURIComponent(params.get('topicId'));
        const topicName = decodeURIComponent(params.get('topicName'));

        services
          .fetchArticles(deliveryClient, topicId)
          .then((articles) => {
            $('#spinner').hide();
            // populate breadcrumb
            $('#breadcrumb').append(
              `<ul><li><a href="index.html">Home</a></li><li>${topicName}</li></ul>`,
            );

            const container = $('#articles');

            articles.forEach((article) => {
              createArticleListItem(
                deliveryClient,
                container,
                article,
                topicName,
                topicId,
              );
            });
          })
          .catch((error) => {
            $('#spinner').hide();
            console.error(error);
          });
      })
      .catch((error) => console.error(error)); // Error parsing JSON file
  });
});
